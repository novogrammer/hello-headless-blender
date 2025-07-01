import { mkdtempSync, rmdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { Worker } from 'bullmq';
import readline from "readline";
import { MINIO_BUCKET_NAME, clientPromise } from './minio.js';
import { connection } from './redis-connection.js';


new Worker(
  'job_queue',
  async (job) => {
    console.time('task');
    const client = await clientPromise;
    const jobId = job.id;
    const temp = mkdtempSync(join(tmpdir(), 'blender-'));
    try {
      const imageObjectKey = `${jobId}/image.jpg`;
      const imageStream = await client.getObject(MINIO_BUCKET_NAME,imageObjectKey);

      const imagePath = join(temp, 'image.jpg');

      const imageBuffers = [];

      // node.js readable streams implement the async iterator protocol
      for await (const data of imageStream) {
        imageBuffers.push(data);
      }

      const image = Buffer.concat(imageBuffers);
      await writeFileSync(imagePath,image);

      await job.updateProgress(0);

      await new Promise<void>((resolve) => {
        const pythonWorker = spawn('python', ['render_worker.py', temp], {
          stdio: ['ignore','pipe','pipe'],
        });
        const rl = readline.createInterface({ input: pythonWorker.stdout });
        interface FrameRange{
          frame_start:number;
          frame_end:number;
        }
        let frameRange:FrameRange|null=null;

        rl.on('line', line => {
          // Render Animation frame_start:0 frame_end:59
          const frameRangeMatch=line.match(/^Render Animation frame_start:(\d+) frame_end:(\d+)/);
          if(frameRangeMatch){
            frameRange={
              frame_start:Number.parseInt(frameRangeMatch[1]),
              frame_end:Number.parseInt(frameRangeMatch[2]),
            }
          }
          // Fra:59 Mem:48.59M (Peak 49.59M) | Time:00:00.86 | Rendering 1 / 16 samples
          const frameMatch=line.match(/^Fra:(\d+)/);
          if(frameMatch){
            const frame=Number.parseInt(frameMatch[1]);
            if(!frameRange){
              console.log("frameRange is null");
            }else{
              const total = frameRange.frame_end - frameRange.frame_start;
              if(0<total){
                const progress = ((frame-frameRange.frame_start)/total)*100;
                job.updateProgress(progress)
              }
            }
          }

          console.log('[stdout]', line);
        });
        pythonWorker.on('close', () => {
          resolve();
        });

      });
      const outputPath = join(temp, 'result.mp4');
      const buffer = readFileSync(outputPath);
      await client.putObject(MINIO_BUCKET_NAME, `${jobId}/result.mp4`, buffer);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'unknown';
      throw e;
    } finally {
      rmdirSync(temp, { recursive: true });
    }
    await job.updateProgress(100);
    console.timeEnd('task');
    return { result: `job ${job.id} done` };
  },
  {
    connection,
    concurrency: 1,
  },
);

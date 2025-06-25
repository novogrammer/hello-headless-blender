import { mkdtempSync, rmdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { Worker } from 'bullmq';
import { MINIO_BUCKET_NAME, clientPromise } from './minio.js';
import { connection } from './redis-connection.js';


new Worker(
  'job_queue',
  async (job) => {
    console.time('task');
    const client = await clientPromise;
    const jobId = job.id;
    await connection.publish(`job:${jobId}`, JSON.stringify({ progress: 0 }));
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


      await new Promise<void>((resolve) => {
        const pythonWorker = spawn('python', ['render_worker.py', temp], {
          stdio: 'inherit',
        });
        pythonWorker.on('close', () => {
          resolve();
        });
      });
      const outputPath = join(temp, 'test.png');
      const buffer = readFileSync(outputPath);
      await client.putObject(MINIO_BUCKET_NAME, `${jobId}/test.png`, buffer);
      await connection.publish(
        `job:${jobId}`,
        JSON.stringify({
          progress: 100,
          resultUrl: `/api/jobs/${jobId}/result`,
        })
      );
    } catch (e) {
      const error = e instanceof Error ? e.message : 'unknown';
      await connection.publish(
        `job:${jobId}`,
        JSON.stringify({ progress: -1, error })
      );
      throw e;
    } finally {
      rmdirSync(temp, { recursive: true });
    }
    console.timeEnd('task');
    return { result: `job ${job.id} done` };
  },
  {
    connection,
    concurrency: 1,
  },
);

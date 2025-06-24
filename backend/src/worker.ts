import { mkdtempSync, rmdirSync, readFileSync } from 'node:fs';
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
    const temp = mkdtempSync(join(tmpdir(), 'blender-'));
    try {
      await new Promise<void>((resolve) => {
        const pythonWorker = spawn('python', ['render_worker.py', temp], {
          stdio: 'inherit',
        });
        pythonWorker.on('close', () => {
          resolve();
        });
      });
      const path = join(temp, 'test.png');
      const buffer = readFileSync(path);
      await client.putObject(MINIO_BUCKET_NAME, `${jobId}/test.png`, buffer);
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

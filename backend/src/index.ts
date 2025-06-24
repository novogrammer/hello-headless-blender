import express from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { mkdtempSync, rmdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { Worker, Queue } from 'bullmq';
import { connection } from './redis-connection.js';
import { MINIO_BUCKET_NAME, clientPromise } from './minio.js';
import { v4 as uuidv4 } from 'uuid';

function makeJobId() {
  return uuidv4();
}

const jobQueue = new Queue('job_queue', { connection });

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

const app = express();
app.use(express.json());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');
createBullBoard({ queues: [new BullMQAdapter(jobQueue)], serverAdapter });
app.use('/queues', serverAdapter.getRouter());

app.post('/jobs', async (req, res) => {
  const jobId = makeJobId();
  await jobQueue.add('mytask', req.body ?? {}, {
    removeOnComplete: { count: 1000 },
    jobId,
  });
  res.json({ jobId });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

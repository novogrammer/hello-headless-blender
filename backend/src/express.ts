import express from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import { connection } from './redis-connection.js';
import { v4 as uuidv4 } from 'uuid';

function makeJobId() {
  return uuidv4();
}

const jobQueue = new Queue('job_queue', { connection });


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

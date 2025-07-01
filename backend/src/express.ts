import express from 'express';
import multer from 'multer';
import { clientPromise, MINIO_BUCKET_NAME } from './minio.js';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue, QueueEvents } from 'bullmq';
import { connection } from './redis-connection.js';
import { v4 as uuidv4 } from 'uuid';

function makeJobId() {
  return uuidv4();
}

const jobQueue = new Queue('job_queue', { connection });
const queueEvents = new QueueEvents('job_queue', { connection });
queueEvents.waitUntilReady().catch((err) => {
  console.error('QueueEvents connection error', err);
});


const app = express();
app.use(express.json());
const upload = multer();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(jobQueue)], serverAdapter });
app.use('/admin/queues', serverAdapter.getRouter());

app.get('/api/jobs/:id/events', async (req, res) => {
  const { id } = req.params;
  // SSE ヘッダ
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // gzip圧縮させない
  res.setHeader('Content-Encoding', 'none');

  function sendState(state: string) {
    res.write(`event: state\n`);
    res.write(`data: ${JSON.stringify({ jobId: id, state })}\n\n`);
  }
  function sendProgress(progress:number) {
    res.write(`event: progress\n`);
    res.write(`data: ${JSON.stringify({ jobId: id, progress })}\n\n`);
  }
  

  function close() {
    res.write('data: [DONE]\n\n');
    setTimeout(() => {
      res.end();
    }, 1000);
  }

  const job = await jobQueue.getJob(id);
  if (!job) {
    sendState('not_found');
    close();
    return;
  }

  const state = await job.getState();
  sendState(state);

  if (state === 'completed' || state === 'failed') {
    close();
    return;
  }

  const onWaiting = ({ jobId }: { jobId: string }) => {
    if (jobId === id) {
      sendState('waiting');
    }
  };
  const onActive = ({ jobId }: { jobId: string }) => {
    if (jobId === id) {
      sendState('active');
    }
  };
  const onCompleted = ({ jobId }: { jobId: string }) => {
    if (jobId === id) {
      cleanup();
      sendState('completed');
      close();
    }
  };
  const onFailed = ({ jobId }: { jobId: string }) => {
    if (jobId === id) {
      cleanup();
      sendState('failed');
      close();
    }
  };
  const onProgress = ({ jobId, data }:{jobId: string,data:number|Object}) => {
    if(typeof data !== "number" ){
      console.error("typeof data is not number");
      return;
    }
    console.log(`Job ${jobId} progress: ${data}%`);
    sendProgress(data);
  };

  const cleanup = () => {

    queueEvents.off('progress', onProgress);
    queueEvents.off('waiting', onWaiting);
    queueEvents.off('active', onActive);
    queueEvents.off('completed', onCompleted);
    queueEvents.off('failed', onFailed);
  };

  res.on('close', cleanup);

  queueEvents.on('progress', onProgress);
  queueEvents.on('waiting', onWaiting);
  queueEvents.on('active', onActive);
  queueEvents.on('completed', onCompleted);
  queueEvents.on('failed', onFailed);
});

app.get('/api/jobs', async (_req, res) => {
  const jobs = await jobQueue.getJobs([
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed',
  ]);
  const jobInfos = await Promise.all(
    jobs.map(async (job) => ({ jobId: job.id, state: await job.getState() }))
  );
  res.json({ jobs: jobInfos });
});

app.get('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const job = await jobQueue.getJob(id);
  const state = job ? await job.getState() : 'not_found';
  res.json({ jobId: id, state });
});

app.get('/api/jobs/:id/result', async (req, res) => {
  const { id } = req.params;
  const client = await clientPromise;
  try {
    const obj = await client.getObject(MINIO_BUCKET_NAME, `${id}/result.mp4`);
    // res.set('Content-Type', 'image/png');
    res.set('Content-Type', 'video/mp4');
    obj.pipe(res);
  } catch {
    res.sendStatus(404);
  }
});

app.get('/api/health', (_req, res) => {
  res.sendStatus(200);
  return;
});

app.post('/api/jobs', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      ok:false,
      message:'no file',
    });
    return;
  }
  if(!req.body.name){
    res.status(400).json({
      ok:false,
      message:'no name',
    });
    return;
  }
  const jobId = makeJobId();
  const client = await clientPromise;
  const imageObjectKey = `${jobId}/image.jpg`;
  const {name} = req.body;
  await client.putObject(MINIO_BUCKET_NAME, imageObjectKey, req.file.buffer);
  await jobQueue.add('mytask', { imageObjectKey, name }, {
    attempts:5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 1000 },
    jobId,
  });
  res.json({
    ok:true,
    jobId,
  });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

import express from 'express';
import multer from 'multer';
import { clientPromise, MINIO_BUCKET_NAME } from './minio.js';
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
const upload = multer();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');
createBullBoard({ queues: [new BullMQAdapter(jobQueue)], serverAdapter });
app.use('/queues', serverAdapter.getRouter());

app.post('/jobs', upload.single('image'), async (req, res) => {
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

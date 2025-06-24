import {mkdtempSync,rmdirSync,readFileSync} from "node:fs";
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { Worker,Queue } from 'bullmq';
import { connection } from './redis-connection.js';
import {MINIO_BUCKET_NAME,clientPromise} from "./minio.js";
import {v4 as uuidv4} from "uuid";


console.log("this is index.js");

function makeJobId(){
  const jobId = uuidv4();
  return jobId;
}

new Worker(
  'job_queue',
  async (job) => {

    console.time("task");
    
    const client = await clientPromise;

    const jobId = job.id;

    const temp = mkdtempSync(join(tmpdir(), 'blender-'));

    try{

      await new Promise<void>((resolve)=>{
        const pythonWorker = spawn("python",[
          "render_worker.py",
          temp,
        ],{
          stdio: 'inherit'
        });
        pythonWorker.on("close",(code)=>{
          resolve();
        })
      })

      const path=join(temp,"test.png");

      const buffer= readFileSync(path);
      await client.putObject(MINIO_BUCKET_NAME,`${jobId}/test.png`,buffer);

    }finally{
      rmdirSync(temp,{
        recursive:true,
      });
    }


    // const inputStream = await client.getObject(MINIO_BUCKET_NAME,`${jobId}/input.txt`);

    // const buffers = [];

    // // node.js readable streams implement the async iterator protocol
    // for await (const data of inputStream) {
    //   buffers.push(data);
    // }

    // const message = Buffer.concat(buffers).toString("utf8");

    // await client.putObject(MINIO_BUCKET_NAME,`${jobId}/output.txt`,"hello " + message);


    console.timeEnd("task");


    return { result: `job ${job.id} done` };
  },
  { connection },
);

// TODO: backendイメージで追加する
{
  const queue=new Queue("job_queue",{
    connection,
  });

  const jobId = makeJobId();

  queue.add("mytask",{foo:"bar"},{
    removeOnComplete: {
      count:1000,
    },
    jobId,
  })

}





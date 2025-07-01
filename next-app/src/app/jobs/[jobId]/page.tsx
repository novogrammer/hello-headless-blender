"use client";
import { useEffect, useState } from "react";
interface Props {
  params: Promise<{
    jobId: string;
  }>;
}

export default function JobPage({ params }: Props) {
  const [jobId, setJobId] = useState<string>("");
  const [state, setState] = useState<string>("unknown");

  useEffect(() => {
    params.then((p) => {
      setJobId(p.jobId);
    });
  }, [params]);

  useEffect(() => {
    if (jobId === "") {
      return;
    }
    const es = new EventSource(`/api/jobs/${jobId}/events`);
    es.onmessage = (ev) => {
      if (ev.data === "[DONE]") {
        es.close();
        return;
      }
      try {
        const data = JSON.parse(ev.data);
        if (data.state) {
          setState(data.state as string);
        }
      } catch (e) {
        console.error(e);
      }
    };
    return () => {
      es.close();
    };
  }, [jobId]);

  return (
    <div>
      <h1>Job {jobId}</h1>
      <p>State: {state}</p>
      {state === "completed" ? (
        <div>
          <video src={`/api/jobs/${jobId}/result`} playsInline autoPlay muted loop controls></video>
          {/* <img src={`/api/jobs/${jobId}/result`} alt="result" /> */}
        </div>
      ):(
        <div>
          Now Rendering...
        </div>
      )}
    </div>
  );
}

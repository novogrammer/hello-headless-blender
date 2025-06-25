"use client";
import { useEffect, useState } from "react";
interface Props {
  params: {
    jobId: string;
  };
}

export default function JobPage({ params }: Props) {
  const jobId = params.jobId;
  const [state, setState] = useState<string>("unknown");

  useEffect(() => {
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
      {state === "completed" && (
        <div>
          <img src={`/api/jobs/${jobId}/result`} alt="result" />
        </div>
      )}
    </div>
  );
}

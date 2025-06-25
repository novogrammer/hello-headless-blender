"use client";
import { useEffect, useState } from "react";
import type { PageProps } from "next";

export default function JobPage({ params }: PageProps<{ jobId: string }>) {
  const { jobId } = params;
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
    </div>
  );
}

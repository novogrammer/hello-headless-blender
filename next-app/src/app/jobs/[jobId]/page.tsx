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
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ jobId }) => {
      setJobId(jobId);
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

  useEffect(() => {
    if (state !== "completed" || jobId === "") {
      return;
    }
    let url: string | null = null;
    fetch(`/api/jobs/${jobId}/result`)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob) {
          url = URL.createObjectURL(blob);
          setResultUrl(url);
        }
      })
      .catch((e) => {
        console.error(e);
      });
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [state, jobId]);

  return (
    <div>
      <h1>Job {jobId}</h1>
      <p>State: {state}</p>
      {resultUrl && (
        <div>
          <img src={resultUrl} alt="result" />
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

export default function JobPage({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/jobs/${jobId}/events`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.resultUrl) {
          setImageUrl(data.resultUrl);
        }
        if (data.error) {
          setError(data.error);
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
      <p>Progress: {progress}</p>
      {imageUrl && <img src={imageUrl} alt="result" />}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

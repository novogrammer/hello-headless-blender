"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function JobsPage() {
  const [jobs, setJobs] = useState<{ jobId: string; state: string }[]>([]);

  useEffect(() => {
    async function fetchJobs() {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs as { jobId: string; state: string }[]);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div>
      <h1>Jobs</h1>
      <ul>
        {jobs.map((job) => (
          <li key={job.jobId}>
            <Link href={`/jobs/${job.jobId}`}>{job.jobId}</Link> - {job.state}
          </li>
        ))}
      </ul>
    </div>
  );
}

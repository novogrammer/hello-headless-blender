"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // home page only links to the job list page

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    const res = await fetch("/api/jobs", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setJobId(data.jobId as string);
    } else {
      setError("failed to create job");
    }
  }

  return (
    <div className={styles["page"]}>
      <h1 className={styles["page"]}>Title</h1>
      <p>
        <Link href="/jobs">All Jobs</Link>
      </p>
      <form onSubmit={handleSubmit} className={styles["page__form"]}>
        <input type="text" name="name" placeholder="name" required />
        <input type="file" name="image" accept="image/jpeg" required />
        <button type="submit">submit</button>
      </form>
      {jobId && (
        <p>
          JobId: <Link href={`/jobs/${jobId}`}>{jobId}</Link>
        </p>
      )}
      {error && <p>{error}</p>}
    </div>
  );
}


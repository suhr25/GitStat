"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SearchForm() {
  const [username, setUsername] = useState(""); const router = useRouter();
  function submit(e: FormEvent) { e.preventDefault(); const value = username.trim().replace(/^@/, ""); if (value) router.push(`/${encodeURIComponent(value)}`); }
  return <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row" aria-label="GitHub username lookup">
    <label className="sr-only" htmlFor="username">GitHub username</label>
    <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="octocat" required pattern="[A-Za-z0-9-]+" className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900" />
    <button className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500">View stats</button>
  </form>;
}

import { notFound } from "next/navigation";
import Dashboard from "@/components/dashboard";
import { getDashboard, GitHubError } from "@/lib/github";

export const revalidate = 3600;
// Up to ten paged GitHub searches run per uncached request.
export const maxDuration = 60;

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try { return <Dashboard data={await getDashboard(username)} />; }
  catch (error) {
    if (error instanceof GitHubError && error.kind === "not-found") notFound();
    const message = error instanceof GitHubError ? error.message : "An unexpected error occurred.";
    const reset = error instanceof GitHubError && error.resetAt ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(error.resetAt)) : null;
    return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5"><section className="panel w-full"><p className="eyebrow">Data temporarily unavailable</p><h1 className="mt-2 text-2xl font-semibold">GitHub couldn’t load this profile</h1><p className="mt-3 text-zinc-600 dark:text-zinc-300">{message}{reset ? ` Try again after ${reset}.` : " Try again in a moment."}</p></section></main>;
  }
}

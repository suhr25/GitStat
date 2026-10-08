"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

const colors = ["#4f46e5", "#0891b2", "#16a34a", "#d97706", "#db2777", "#7c3aed", "#71717a"];
export function LanguageChart({ languages }: { languages: { name: string; size: number }[] }) {
  const top = languages.slice(0, 6); const rest = languages.slice(6).reduce((n, l) => n + l.size, 0); const data = rest ? [...top, { name: "Other", size: rest }] : top;
  if (!data.length) return <p className="text-sm text-zinc-500">No language byte data is available for this user’s non-fork public repositories.</p>;
  return <><div className="h-56" aria-hidden="true"><ResponsiveContainer><PieChart><Pie data={data} dataKey="size" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={2}>{data.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip formatter={(value) => `${Number(value).toLocaleString()} bytes`} /></PieChart></ResponsiveContainer></div><ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{data.map((item, i) => <li key={item.name} className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors[i] }} /><span className="truncate">{item.name}</span><span className="ml-auto text-zinc-500">{Math.round(item.size / 1024).toLocaleString()} KB</span></li>)}</ul><p className="sr-only">Language usage: {data.map((x) => `${x.name}, ${x.size.toLocaleString()} bytes`).join("; ")}.</p></>;
}

export function ActivityChart({ data }: { data: { month: string; commits: number; prs: number; issues: number; reviews: number }[] }) {
  return <><div className="h-72" aria-hidden="true"><ResponsiveContainer><BarChart data={data} margin={{ left: -20, right: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip /><Legend /><Bar dataKey="commits" name="Commits" stackId="a" fill="#4f46e5" /><Bar dataKey="prs" name="PRs" stackId="a" fill="#0891b2" /><Bar dataKey="issues" name="Issues" stackId="a" fill="#d97706" /><Bar dataKey="reviews" name="Reviews" stackId="a" fill="#16a34a" /></BarChart></ResponsiveContainer></div><p className="sr-only">Monthly GitHub contribution activity. {data.map((d) => `${d.month}: ${d.commits} commits, ${d.prs} pull requests, ${d.issues} issues, ${d.reviews} reviews`).join(". ")}</p></>;
}

export function ImpactChart({ data }: { data: { organization: string; prs: number; changed: number }[] }) {
  if (!data.length) return <p className="text-sm text-zinc-500">No merged public pull requests outside this account were returned by GitHub.</p>;
  return <><div className="h-64" aria-hidden="true"><ResponsiveContainer><BarChart data={data.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 18 }}><CartesianGrid horizontal={false} strokeDasharray="3 3" /><XAxis type="number" tickLine={false} axisLine={false} /><YAxis type="category" dataKey="organization" width={95} tickLine={false} axisLine={false} /><Tooltip formatter={(value, name) => [Number(value).toLocaleString(), name === "changed" ? "Lines changed" : "Merged PRs"]} /><Bar dataKey="changed" name="changed" fill="#4f46e5" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div><p className="sr-only">Open-source impact by organization: {data.map((item) => `${item.organization}: ${item.prs} merged pull requests and ${item.changed} lines changed`).join(". ")}</p></>;
}

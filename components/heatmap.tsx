import type { CalendarDay } from "@/lib/github";

export function streaks(days: CalendarDay[]) {
  let current = 0, longest = 0, run = 0;
  for (const day of days) { if (day.count > 0) { run++; longest = Math.max(longest, run); } else run = 0; }
  for (let i = days.length - 1; i >= 0 && days[i].count > 0; i--) current++;
  return { current, longest };
}

const colors = ["bg-zinc-100 dark:bg-zinc-800", "bg-indigo-200 dark:bg-indigo-950", "bg-indigo-400 dark:bg-indigo-800", "bg-indigo-600 dark:bg-indigo-600", "bg-indigo-800 dark:bg-indigo-400"];

export default function Heatmap({ days }: { days: CalendarDay[] }) {
  const weeks: CalendarDay[][] = []; for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return <div className="overflow-x-auto pb-1" aria-label="Contribution heatmap for the past 12 months">
    <div className="flex min-w-[680px] gap-1">{weeks.map((week, wi) => <div className="flex flex-col gap-1" key={wi}>{week.map((day) => <div key={day.date} title={`${day.date}: ${day.count} contributions`} aria-label={`${day.date}: ${day.count} contributions`} className={`h-3 w-3 rounded-sm ${colors[day.level]}`} />)}</div>)}</div>
    <p className="sr-only">Each square represents one day, colored by contribution count. Detailed counts are available in the activity summary below.</p>
  </div>;
}

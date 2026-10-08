import "server-only";
import { cache } from "react";

const API = "https://api.github.com/graphql";
const HOUR = 3600;

type GqlError = { message: string; type?: string };
type GqlResponse<T> = { data?: T; errors?: GqlError[] };

export class GitHubError extends Error {
  constructor(public kind: "not-found" | "rate-limit" | "network" | "api", message: string, public resetAt?: string) { super(message); }
}

async function github<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new GitHubError("api", "GitHub is not configured. Add GITHUB_TOKEN to the server environment.");
  let response: Response;
  try {
    response = await fetch(API, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query, variables }), next: { revalidate: HOUR } });
  } catch { throw new GitHubError("network", "GitHub could not be reached. Please try again shortly."); }
  const json = await response.json() as GqlResponse<T>;
  const error = json.errors?.[0];
  if (error) {
    if (/could not resolve to a User|not found/i.test(error.message)) throw new GitHubError("not-found", "This GitHub user does not exist.");
    if (/rate limit/i.test(error.message)) { const reset = response.headers.get("x-ratelimit-reset"); throw new GitHubError("rate-limit", "GitHub API rate limit reached.", reset ? new Date(Number(reset) * 1000).toISOString() : undefined); }
    throw new GitHubError("api", error.message);
  }
  if (!json.data) throw new GitHubError("api", "GitHub returned no data.");
  return json.data;
}

export type CalendarDay = { date: string; count: number; level: number };
export type Repo = { name: string; description: string | null; url: string; stars: number; forks: number; language: string | null; updatedAt: string };
export type PullRequest = { title: string; url: string; repository: string; organization: string; ownerType: "Organization" | "User"; mergedAt: string; additions: number; deletions: number };
export type GitHubDashboard = {
  login: string; name: string | null; bio: string | null; location: string | null; avatarUrl: string; url: string; followers: number; following: number; publicRepos: number; createdAt: string;
  calendar: CalendarDay[]; totalContributions: number; languages: { name: string; size: number }[]; repos: Repo[]; impact: PullRequest[]; impactTotal: number; monthly: { month: string; commits: number; prs: number; issues: number; reviews: number }[];
};

const DASHBOARD_QUERY = `query Dashboard($login: String!, $from: DateTime!, $to: DateTime!) {
 user(login: $login) {
  login name bio location avatarUrl url createdAt followers { totalCount } following { totalCount } repositories(privacy: PUBLIC, ownerAffiliations: OWNER, first: 100, orderBy: {field: STARGAZERS, direction: DESC}) { totalCount nodes { name description url stargazerCount forkCount updatedAt isFork primaryLanguage { name } languages(first: 20, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name } } } } }
  contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } }
 }
}`;

const IMPACT_QUERY = `query Impact($query: String!, $after: String) { search(query: $query, type: ISSUE, first: 100, after: $after) { issueCount pageInfo { hasNextPage endCursor } nodes { ... on PullRequest { title url mergedAt additions deletions repository { nameWithOwner owner { __typename login } } } } } }`;
type ImpactNode = { title: string; url: string; mergedAt: string; additions: number; deletions: number; repository: { nameWithOwner: string; owner: { __typename: "Organization" | "User"; login: string } } | null } | null;

// GitHub search stops at 1,000 results, so this reads at most ten pages of 100.
async function mergedPullRequests(login: string) {
  const nodes: ImpactNode[] = []; let after: string | null = null; let total = 0;
  for (let page = 0; page < 10; page++) {
    const data: { search: { issueCount: number; pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ImpactNode[] } } = await github(IMPACT_QUERY, { query: `is:pr author:${login} is:merged -user:${login} sort:created-desc`, after });
    total = data.search.issueCount; nodes.push(...data.search.nodes);
    if (!data.search.pageInfo.hasNextPage || !data.search.pageInfo.endCursor) break;
    after = data.search.pageInfo.endCursor;
  }
  return { nodes, total };
}

function monthRange(index: number) {
  const now = new Date(); const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
  const end = index === 11 ? now : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString(), label: start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) };
}

async function monthlyActivity(login: string) {
  const ranges = Array.from({ length: 12 }, (_, i) => monthRange(i));
  const definitions = ranges.map((_, i) => `m${i}: contributionsCollection(from: $f${i}, to: $t${i}) { totalCommitContributions totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions }`).join("\n");
  const vars = ranges.reduce<Record<string, unknown>>((all, range, i) => ({ ...all, [`f${i}`]: range.start, [`t${i}`]: range.end }), { login });
  const variableDefs = ["$login: String!", ...ranges.flatMap((_, i) => [`$f${i}: DateTime!`, `$t${i}: DateTime!`])].join(", ");
  const data = await github<{ user: Record<string, { totalCommitContributions: number; totalPullRequestContributions: number; totalIssueContributions: number; totalPullRequestReviewContributions: number }> }>(`query Activity(${variableDefs}) { user(login: $login) { ${definitions} } }`, vars);
  return ranges.map((range, i) => ({ month: range.label, commits: data.user[`m${i}`].totalCommitContributions, prs: data.user[`m${i}`].totalPullRequestContributions, issues: data.user[`m${i}`].totalIssueContributions, reviews: data.user[`m${i}`].totalPullRequestReviewContributions }));
}

export const getDashboard = cache(async (rawLogin: string): Promise<GitHubDashboard> => {
  const login = rawLogin.replace(/^@/, "");
  const to = new Date().toISOString(); const fromDate = new Date(); fromDate.setUTCFullYear(fromDate.getUTCFullYear() - 1); const from = fromDate.toISOString();
  const [main, activity, impactData] = await Promise.all([
    github<{ user: { login: string; name: string | null; bio: string | null; location: string | null; avatarUrl: string; url: string; createdAt: string; followers: { totalCount: number }; following: { totalCount: number }; repositories: { totalCount: number; nodes: Array<{ name: string; description: string | null; url: string; stargazerCount: number; forkCount: number; updatedAt: string; isFork: boolean; primaryLanguage: { name: string } | null; languages: { edges: Array<{ size: number; node: { name: string } }> } }> }; contributionsCollection: { contributionCalendar: { totalContributions: number; weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: number }> }> } } } }>(DASHBOARD_QUERY, { login, from, to }),
    monthlyActivity(login),
    mergedPullRequests(login),
  ]);
  const user = main.user; if (!user) throw new GitHubError("not-found", "This GitHub user does not exist.");
  const languageMap = new Map<string, number>();
  const repos = user.repositories.nodes.filter((repo) => !repo.isFork).map((repo) => { for (const edge of repo.languages.edges) languageMap.set(edge.node.name, (languageMap.get(edge.node.name) ?? 0) + edge.size); return { name: repo.name, description: repo.description, url: repo.url, stars: repo.stargazerCount, forks: repo.forkCount, language: repo.primaryLanguage?.name ?? null, updatedAt: repo.updatedAt }; });
  const impact = impactData.nodes.flatMap((pr) => pr?.repository ? [{ title: pr.title, url: pr.url, mergedAt: pr.mergedAt, additions: pr.additions, deletions: pr.deletions, repository: pr.repository.nameWithOwner, organization: pr.repository.owner.login, ownerType: pr.repository.owner.__typename }] : []);
  const levels: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  return { login: user.login, name: user.name, bio: user.bio, location: user.location, avatarUrl: user.avatarUrl, url: user.url, createdAt: user.createdAt, followers: user.followers.totalCount, following: user.following.totalCount, publicRepos: user.repositories.totalCount, calendar: user.contributionsCollection.contributionCalendar.weeks.flatMap((week) => week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount, level: levels[String(day.contributionLevel)] ?? 0 }))), totalContributions: user.contributionsCollection.contributionCalendar.totalContributions, languages: [...languageMap].map(([name, size]) => ({ name, size })).sort((a,b) => b.size - a.size), repos: repos.slice(0, 6), impact, impactTotal: impactData.total, monthly: activity };
});

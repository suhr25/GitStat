import { getDashboard, GitHubError } from "@/lib/github";

export const revalidate = 3600;
function escape(value: string) { const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" }; return value.replace(/[&<>'\"]/g, (c) => entities[c] ?? c); }

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const data = await getDashboard((await params).username); const name = escape(data.name ?? data.login);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="180" viewBox="0 0 520 180" role="img" aria-label="GitStat for ${name}"><rect width="520" height="180" rx="16" fill="#18181b"/><rect x="1" y="1" width="518" height="178" rx="15" fill="none" stroke="#3f3f46"/><text x="28" y="40" fill="#a5b4fc" font-family="ui-monospace,monospace" font-size="14" font-weight="700">GITSTAT / 01</text><text x="28" y="78" fill="#fafafa" font-family="system-ui,sans-serif" font-size="27" font-weight="700">${name}</text><text x="28" y="105" fill="#a1a1aa" font-family="system-ui,sans-serif" font-size="15">@${escape(data.login)} · last 12 months</text><line x1="28" y1="123" x2="492" y2="123" stroke="#3f3f46"/><text x="28" y="153" fill="#fafafa" font-family="system-ui,sans-serif" font-size="18" font-weight="700">${data.totalContributions.toLocaleString()}</text><text x="28" y="171" fill="#a1a1aa" font-family="system-ui,sans-serif" font-size="12">contributions</text><text x="220" y="153" fill="#fafafa" font-family="system-ui,sans-serif" font-size="18" font-weight="700">${data.publicRepos.toLocaleString()}</text><text x="220" y="171" fill="#a1a1aa" font-family="system-ui,sans-serif" font-size="12">public repos</text><text x="390" y="153" fill="#fafafa" font-family="system-ui,sans-serif" font-size="18" font-weight="700">${data.followers.toLocaleString()}</text><text x="390" y="171" fill="#a1a1aa" font-family="system-ui,sans-serif" font-size="12">followers</text></svg>`;
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) { const status = error instanceof GitHubError && error.kind === "not-found" ? 404 : 503; return new Response("GitStat data unavailable", { status, headers: { "Content-Type": "text/plain" } }); }
}

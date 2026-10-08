# GitStat

GitStat is a server-rendered GitHub activity dashboard built with Next.js. It only displays values returned by GitHub’s APIs; unavailable public data is shown as an empty state rather than inferred.

## Architecture

- **App Router + server components:** profile pages fetch on the server; browser code never receives `GITHUB_TOKEN`.
- **`lib/github.ts`:** a typed, single-purpose API layer. Its dashboard request combines profile, repository, language, and contribution-calendar data; the monthly chart uses twelve exact GitHub contribution windows.
- **Caching:** GitHub requests and pages revalidate hourly. The SVG card also sends Vercel-friendly shared-cache headers.
- **Charts:** Recharts is isolated in client components. Each has a screen-reader text equivalent.

## GitHub API caveats

GitHub’s contribution records represent GitHub’s definition of a contribution, which can differ from raw git history. The activity chart is therefore labelled as GitHub contribution data. The “open-source impact” search returns public, merged PRs authored outside the user account; GitHub search returns at most 1,000 results and this view reads all of them (up to 1,000), grouped by organization with an expandable per-org breakdown. Private contributions/repositories are not exposed by a public read-only token.

## Setup

1. Use Node.js 20.9 or newer.
2. Install packages: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new). Set repository access to **Public Repositories**. No write permissions or repository permissions are needed for public data.
5. Put the token in `GITHUB_TOKEN` in `.env.local`.
6. Start the app: `npm run dev`, then open `http://localhost:3000`.

## Verify features

- Search for `octocat`, then compare profile details, stars and repository links with GitHub.
- Inspect the heatmap total against the public GitHub profile’s contribution graph. Its current and longest streaks are computed directly from the returned daily calendar.
- Confirm each language chart label represents byte totals from non-fork public repositories.
- Compare a monthly chart tooltip with GitHub contribution data; each monthly value is a separate exact GraphQL date window.
- Try a nonsense username: `/definitely-not-a-real-github-user-zz`; it should render a friendly 404.
- Open `/api/card/octocat` directly, or embed it in Markdown:

  `![GitStat](https://YOUR_DEPLOYMENT.vercel.app/api/card/octocat)`

## Deploy to Vercel

Import the repository in Vercel, set `GITHUB_TOKEN` under **Settings → Environment Variables** for Production (and Preview if desired), and deploy. Do not prefix the variable with `NEXT_PUBLIC_`; it is deliberately server-only. Vercel detects Next.js automatically.

## Commands

- `npm run dev`: local development
- `npm run build`: production build/type validation
- `npm run start`: serve the production build

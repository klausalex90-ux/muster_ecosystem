# GitHub to Vercel to Whop Deployment

## Architecture

Production deployment should flow through:

1. GitHub repository.
2. GitHub CI for `progress-engine`.
3. Vercel Git integration.
4. Whop app hosting settings.

The deployable app is the nested `progress-engine` directory, not the repository root.

## GitHub Setup

1. Push this workspace to GitHub.
2. Keep the app code under `progress-engine/`.
3. Let the included GitHub Actions workflow run on pushes and pull requests:

```text
.github/workflows/progress-engine-ci.yml
```

The workflow runs:

```bash
pnpm deploy:preflight
```

That command runs tests, lint, and production build.

## Vercel Setup

Import the GitHub repository into Vercel.

Project settings:

- Framework Preset: `Next.js`
- Root Directory: `progress-engine`
- Build Command: `pnpm build`
- Install Command: leave default
- Output Directory: leave default

Environment variables:

```bash
WHOP_API_KEY=...
WHOP_APP_ID=...
ENABLE_EXPERIMENTAL_COREPACK=1
```

`WHOP_API_KEY` and `WHOP_APP_ID` come from the Whop developer dashboard.
`ENABLE_EXPERIMENTAL_COREPACK=1` lets Vercel use the pnpm version pinned in `package.json`.

The project includes:

- `packageManager: pnpm@11.7.0`
- `vercel.json` with the build command
- `.env.example` with required Whop variables

## Whop Setup

In the Whop developer dashboard:

1. Create or open the app.
2. Copy the app environment variables.
3. After Vercel deploys, copy the production deployment URL.
4. In Whop Hosting settings, set the base URL to the Vercel production URL.
5. Configure app views:

```text
Experience View: /experiences/[experienceId]
Dashboard View: /dashboard/[companyId]
```

6. Install the app into a test Whop.
7. Open the member experience from the Whop sidebar.
8. Open the dashboard app from the business dashboard.

## Preflight Checklist

Run locally before pushing:

```bash
pnpm install
pnpm deploy:preflight
```

Confirm:

- `pnpm test` passes.
- `pnpm lint` passes.
- `pnpm build` passes.
- Vercel project root is `progress-engine`.
- Whop environment variables are set in Vercel production.
- Whop app paths match the dynamic Next routes.

## Known Limitations

- Current member tool state uses browser local storage for MVP preview.
- Whop-gated routes require the signed Whop iframe token and will show the access-required state outside Whop.
- Production analytics will need durable database persistence in a future cycle.

## Future Improvements

- Add Vercel preview deployment smoke tests.
- Add database migrations for production persistence.
- Add Whop install verification steps to CI/CD once a test app environment exists.
- Add deployment status badges to the README.

# Military Standards Engine

## Architecture

The current Military Standards Engine is a local TypeScript intelligence layer at `src/lib/military-standards.ts`.
It centralizes branch-specific fitness assessment metadata for The Muster member experience:

- Branch list used by onboarding and PT tracking.
- Official source URL and research date.
- Assessment name and current policy note.
- Event focus list for training planning.
- Branch-specific recruiter question prompt.
- MVP readiness band logic for push-ups, plank, and run time.

The member-facing `MusterSuite` consumes this layer in three places:

- Ship Date Countdown shows the selected branch standard and official source.
- PT Score Tracker shows branch event focus and readiness coaching.
- Recruiter Question Prep recommends the next standards question to ask.

## API Documentation

Exports from `src/lib/military-standards.ts`:

- `branches`: canonical branch names supported by the app.
- `standardsByBranch`: branch-to-standard metadata map.
- `standardsUpdatedAt`: date the local standards intelligence was last reviewed.
- `getStandardsForBranch(branch)`: returns branch standards, falling back to Army for unknown values.
- `isMusterBranch(branch)`: type guard for supported branch names.
- `readinessBand(pushups, plankSeconds, runSeconds)`: returns `Ready`, `Passing`, or `Needs work`.
- `readinessCoaching(band, branch)`: returns UI coaching copy that references the branch assessment.

## User Guide

1. Open The Muster member app.
2. Choose a branch in Ship Date Countdown.
3. Save the countdown settings.
4. Review the standard source and training focus below the countdown.
5. Log PT numbers in the PT Score Tracker.
6. Use the event focus and recruiter prompt to confirm exact standards before signing or shipping.

## Developer Guide

When a branch standard changes:

1. Update `standardsByBranch` in `src/lib/military-standards.ts`.
2. Set `standardsUpdatedAt` to the research date.
3. Add or update tests in `src/lib/military-standards.test.ts`.
4. Run `pnpm test`, `pnpm lint`, and `pnpm build`.
5. Add a changelog entry with source notes.

Do not hard-code standards copy in React components. Components should read from the standards engine so future API-backed or database-backed standards can replace the local module cleanly.

## Deployment Guide

No new environment variables are required. Deploy with the existing Next.js process:

```bash
pnpm install
pnpm build
```

The official source links open in a new browser tab and do not require Whop permissions.

## Known Limitations

- The readiness band is an MVP cross-branch baseline, not an official score calculation.
- Age, sex, height, weight, MOS, rating, job, accession path, and waiver rules are not scored yet.
- Source pages can change without a package release; the `standardsUpdatedAt` field must be refreshed during research cycles.
- Coast Guard and Space Force guidance is intentionally conservative and should be verified with recruiter-specific accession requirements.

## Future Improvements

- Add demographic-aware official score calculators by branch.
- Add standards version history with policy effective dates.
- Add API routes for recruiter/admin review.
- Add member alerts when selected branch standards change.
- Add MOS/rating/job-specific physical requirement overlays.
- Store standards research citations in a database table instead of a local module.

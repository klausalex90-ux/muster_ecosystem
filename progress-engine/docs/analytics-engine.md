# Analytics Engine

## Architecture

The Analytics Engine lives at `src/lib/analytics-engine.ts`.
It turns member signals from the existing engines into a recruiter-actionable risk and retention view.

Inputs:

- Habit readiness from the Habit System.
- PT readiness from the Military Standards Engine.
- Soreness from the Fitness Engine.
- Training focus from the Fitness Engine.
- Recruiter prep completion.
- Days until ship date.

Outputs:

- Risk level.
- Retention score.
- Signal table.
- Recruiter prep rate.
- Priority reasons.
- Next best action.

The member view shows retention score, risk, next action, and signal chips in the header. The admin view uses the same analytics output in `Muster Snapshot`.

## API Documentation

Exports from `src/lib/analytics-engine.ts`:

- `AnalyticsRiskLevel`: `Low`, `Moderate`, or `High`.
- `AnalyticsSignal`: label, value, and status for one signal.
- `MemberAnalytics`: full analytics result.
- `memberAnalytics(input)`: combines readiness, PT, recruiter, soreness, ship-date, and training-focus inputs into a risk report.

## Research Basis

This cycle used stable readiness and recruiting analytics principles:

- Multi-domain readiness is more useful than a single isolated measure.
- Risk rises when weak signals stack together.
- Late ship-date windows should increase urgency.
- Analytics should produce a clear next action, not only a score.

Primary source families reviewed:

- Total Force Fitness and military human-performance readiness concepts.
- HPRC-style performance guidance around sleep, nutrition, recovery, and training load.
- Military recruiting and attrition research emphasizing combined predictors and early risk identification.

## User Guide

Members see:

- Retention score.
- Risk level.
- Next action.
- Signal chips for habits, PT, recruiter prep, soreness, and ship date.

Admins see the same score and risk level in `Muster Snapshot`, plus a signal table and priority reasons.

## Developer Guide

When changing analytics logic:

1. Update `src/lib/analytics-engine.ts`.
2. Add or update tests in `src/lib/analytics-engine.test.mts`.
3. Keep analytics deterministic and side-effect free.
4. Run `pnpm test`, `pnpm lint`, and `pnpm build`.
5. Update `CHANGELOG.md`.

Do not read browser storage or server state directly inside the engine. Pass already-normalized signals into `memberAnalytics`.

## Deployment Guide

No new environment variables or Whop permissions are required.

```bash
pnpm install
pnpm build
```

The engine runs inside the existing Next.js app and currently reads local member state through the UI layer.

## Known Limitations

- The retention score is a heuristic and not a validated attrition model.
- It currently evaluates one member at a time.
- It does not yet persist historical analytics snapshots.
- It does not yet include community engagement, message response time, purchases, or subscription activity.

## Future Improvements

- Add roster-level aggregation for recruiter dashboards.
- Store analytics snapshots server-side.
- Add trend lines for improving or worsening risk.
- Add configurable recruiter alerts.
- Feed risk reasons into AI coaching prompts.

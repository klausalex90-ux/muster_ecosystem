# Fitness Engine

## Architecture

The Fitness Engine lives at `src/lib/fitness-engine.ts` and converts The Muster member context into a short training plan.
It is intentionally separate from React so it can later power Whop views, API routes, mobile apps, recruiter dashboards, and AI coaching.

Inputs:

- Selected branch from the Military Standards Engine.
- Latest PT baseline from the PT Score Tracker.
- Days until ship date from Ship Date Countdown.
- Adaptive constraints from the member: minutes available, equipment access, and soreness.

Outputs:

- Primary training focus.
- Readiness band.
- Branch assessment name.
- Seven training sessions.
- Recovery and injury-prevention caution copy.
- Adaptation summary for time, equipment, and soreness.

## API Documentation

Exports from `src/lib/fitness-engine.ts`:

- `PtBaseline`: push-ups, plank seconds, and run seconds.
- `TrainingFocus`: `baseline`, `pushups`, `plank`, `run`, `balanced`, or `taper`.
- `EquipmentAccess`: `none`, `basic`, or `full`.
- `SorenessLevel`: `low`, `moderate`, or `high`.
- `TrainingConstraints`: equipment, available minutes, and soreness.
- `TrainingSession`: one day of work and recovery guidance.
- `TrainingPlan`: the complete generated plan.
- `identifyPrimaryFocus(baseline, daysUntilShip)`: selects the most important focus from readiness gaps or ship-date taper timing.
- `normalizeConstraints(constraints)`: validates equipment, soreness, and available minutes.
- `generateSevenDayTrainingPlan({ baseline, branch, constraints, daysUntilShip })`: returns the connected seven-day plan.

## Research Basis

This cycle used conservative training principles that are stable across current military fitness guidance:

- Progressive overload without repeated max-effort days.
- Aerobic base work before aggressive run-speed work.
- Movement preparation and recovery as part of the training week.
- Event specificity based on the selected branch standard.
- Tapering instead of hard new stimulus near ship date.
- Active recovery and reduced volume when soreness is elevated.

Primary source families reviewed:

- U.S. Army Holistic Health and Fitness and Army Fitness Test guidance.
- Department of Defense and military human performance injury-prevention resources.
- Branch physical readiness program pages already tracked by the Military Standards Engine.

## User Guide

1. Enter a branch and ship date.
2. Save a PT score with push-ups, plank seconds, and run time.
3. Set available minutes, equipment access, and soreness in `7-Day Training Orders`.
4. Review the adapted plan.
5. Train the listed day, then use Daily Accountability Check-In to lock completion.
6. Retest PT weekly or after a full training block.

If no PT score exists, the plan starts with baseline testing and easy movement. If ship date is within 10 days, the plan switches to taper mode.
If soreness is high, day one becomes an active recovery reset instead of a hard session.

## Developer Guide

When changing training logic:

1. Update `src/lib/fitness-engine.ts`.
2. Keep branch metadata in `src/lib/military-standards.ts`.
3. Add or update tests in `src/lib/fitness-engine.test.mts`.
4. Run `pnpm test`, `pnpm lint`, and `pnpm build`.
5. Update `CHANGELOG.md`.

The engine should not store state directly. State belongs in the app, API layer, or future database tables.

## Deployment Guide

No new environment variables or Whop permissions are required.

```bash
pnpm install
pnpm build
```

The feature runs as part of the existing Next.js app and reads only local member state.

## Known Limitations

- This is general preparation guidance, not medical advice or an individualized prescription.
- It does not yet include age, sex, training history, injury location, or official scoring tables.
- Soreness input is self-reported and does not diagnose injury.
- Equipment substitutions are broad and not yet exercise-by-exercise replacements.
- It does not yet periodize beyond seven days.
- It does not yet write completed training sessions into server-side analytics.

## Future Improvements

- Add 4-, 8-, and 12-week periodized plans.
- Add exercise-by-exercise equipment substitutions.
- Add injury location intake before daily session generation.
- Add ruck and swim progressions.
- Add recruiter/admin views showing who followed the plan.
- Add AI coaching that adapts the next week from compliance, soreness, and PT trends.

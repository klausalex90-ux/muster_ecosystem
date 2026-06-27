# Habit System

## Architecture

The Habit System lives at `src/lib/habit-engine.ts`.
It converts daily accountability logs, PT readiness, and soreness into a member-facing readiness score.

Inputs:

- Daily Accountability Check-In logs.
- PT readiness from the Military Standards Engine.
- Soreness from the adaptive Fitness Engine controls.
- Current date.

Outputs:

- Habit readiness score.
- Readiness band.
- Current complete-day streak.
- Seven-day complete-day count.
- Domain scores.
- Weak domain and next action.

The `MusterSuite` renders this inside `Daily Accountability Check-In` so habit feedback sits directly next to the member action that changes it.

## API Documentation

Exports from `src/lib/habit-engine.ts`:

- `HabitLog`: one daily accountability record.
- `HabitDomain`: `physical`, `nutrition`, `knowledge`, `discipline`, or `recovery`.
- `HabitScore`: score and weight for one habit domain.
- `HabitReadiness`: full readiness result.
- `habitReadiness({ logs, ptReadiness, soreness, today })`: returns the readiness score, band, domains, weak point, and next action.
- `currentHabitStreak(logs, today)`: counts consecutive complete days ending today.
- `isCompleteHabitDay(log)`: returns true when all accountability boxes are complete.

## Research Basis

This cycle used readiness concepts that are stable across military performance guidance:

- Consistent daily execution matters more than occasional max effort.
- Physical readiness depends on training, nutrition, knowledge/preparation, discipline, and recovery.
- Elevated soreness should reduce readiness until recovery behaviors are protected.
- Habit feedback should produce one clear next action.

Primary source families reviewed:

- Army Holistic Health and Fitness readiness domains.
- Total Force Fitness concepts around physical, nutritional, psychological, and recovery readiness.
- HPRC-style guidance on recovery, soreness, sleep, and performance habits.

## User Guide

1. Open `Daily Accountability Check-In`.
2. Lock PT, nutrition, study/prep, and no-excuses boxes.
3. Review `Habit readiness`.
4. Use the weak point and next action to decide what to fix before the day ends.
5. Repeat daily to build a complete-day streak.

## Developer Guide

When changing scoring:

1. Update `src/lib/habit-engine.ts`.
2. Add or update tests in `src/lib/habit-engine.test.mts`.
3. Keep UI copy in `MusterSuite` short and action-oriented.
4. Run `pnpm test`, `pnpm lint`, and `pnpm build`.
5. Update `CHANGELOG.md`.

The engine should stay deterministic and side-effect free so it can later power recruiter dashboards, analytics, and AI coaching.

## Deployment Guide

No new environment variables or Whop permissions are required.

```bash
pnpm install
pnpm build
```

The feature runs inside the existing Next.js app and reads local member state.

## Known Limitations

- The score is an MVP readiness heuristic, not an official military readiness assessment.
- It does not yet include sleep hours, mood, injury location, hydration, or objective wearable data.
- Domain weights are fixed and not yet personalized by branch, ship date, or training history.
- Local storage persistence is not suitable for production analytics.

## Future Improvements

- Add sleep, hydration, and mood check-ins.
- Feed habit score into admin/recruiter risk views.
- Add weekly trend charts.
- Trigger AI coaching prompts when a domain stays weak.
- Move habit logs into durable server persistence.

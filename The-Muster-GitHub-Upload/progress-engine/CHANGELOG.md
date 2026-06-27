# Changelog

## 2026-06-27 - GitHub to Vercel to Whop Deployment

- Added a deployment guide for the GitHub -> Vercel -> Whop production path.
- Added Vercel build config, `.env.example`, package-manager pinning, and a `deploy:preflight` script.
- Added GitHub Actions CI for `progress-engine` pushes and pull requests.
- Updated the README with Vercel root-directory guidance and preflight steps.

## 2026-06-26 - Analytics Engine

- Added a reusable Analytics Engine that combines habit readiness, PT readiness, soreness, recruiter prep, ship-date pressure, and training focus.
- Added member-facing retention score, risk level, analytics next action, and signal chips.
- Added admin `Muster Snapshot` analytics with retention, risk, signal table, and priority reasons.
- Added test coverage for low-risk, high-risk, missing PT baseline, and recruiter-prep edge cases.
- Documented architecture, API surface, user guide, developer guide, deployment notes, limitations, and roadmap in `docs/analytics-engine.md`.

## 2026-06-26 - Habit System

- Added a reusable Habit Engine that scores daily accountability across physical, nutrition, knowledge, discipline, and recovery domains.
- Added Habit Readiness to `Daily Accountability Check-In` with score, band, weak-domain callout, seven-day locks, domain bars, and next action.
- Integrated PT readiness and soreness into habit scoring so Fitness Engine signals feed the Habit System.
- Added test coverage for complete days, streaks, locked-in weeks, weak-domain detection, and soreness recovery penalties.
- Documented architecture, API surface, user guide, developer guide, deployment notes, limitations, and roadmap in `docs/habit-system.md`.

## 2026-06-26 - Adaptive Training Orders

- Added adaptive Fitness Engine constraints for available minutes, equipment access, and soreness.
- Added member controls in `7-Day Training Orders` so plans adjust for short sessions, limited equipment, and recovery-first days.
- Added validation and test coverage for invalid adaptive inputs, high-soreness active recovery, time caps, and equipment substitutions.
- Updated Fitness Engine documentation and product README coverage.

## 2026-06-26 - Fitness Engine

- Added a reusable Fitness Engine that generates seven-day training plans from branch, ship-date pressure, and latest PT baseline.
- Added `7-Day Training Orders` to The Muster member app with primary focus, daily work, and recovery guidance.
- Added test coverage for baseline mode, weak-point selection, taper mode, and branch assessment context.
- Documented architecture, API surface, user guide, developer guide, deployment notes, limitations, and roadmap in `docs/fitness-engine.md`.

## 2026-06-26

- Added the local Military Standards Engine for branch-aware assessment metadata, official source links, event focus, and recruiter prompts.
- Wired standards intelligence into The Muster member app countdown, PT tracker, and recruiter prep surfaces.
- Added `pnpm test` with Node test coverage for standards lookup, readiness bands, fallback behavior, and coaching copy.
- Documented architecture, API surface, user guide, developer guide, deployment notes, known limitations, and roadmap in `docs/military-standards-engine.md`.

# The Muster

A Whop-ready Next.js app suite for a military prep community.

The member experience includes five simple tools:

1. Ship Date Countdown
2. Daily Accountability Check-In
3. PT Score Tracker
4. Recruiter Question Prep
5. 7-Day Training Orders

These tools now share a local Military Standards Engine so the selected branch can drive assessment context, event focus, source links, and recruiter prep prompts.
The Fitness Engine uses that same context plus the latest PT baseline, soreness, available time, and equipment access to generate a connected weekly training plan.
The Habit System turns daily execution into a readiness score, weak-domain callout, and next action.
The Analytics Engine rolls those signals into retention score, risk level, and recruiter/admin priority reasons.

These are designed for members working toward joining the military: simple, fast, and mobile-first.

## Built Apps

### Ship Date Countdown

Members enter their branch, ship date, and focus statement. The app shows days remaining and the current prep focus.

### Daily Accountability Check-In

Members lock four daily boxes:

- PT done
- Nutrition on track
- Studied or prepared
- No excuses today

The app tracks complete days and current streak.
It also calculates habit readiness across physical training, nutrition, knowledge, discipline, and recovery.

### PT Score Tracker

Members log push-ups, plank seconds, and run time. The app gives a simple readiness call: `Needs work`, `Passing`, or `Ready`, then adds branch-aware event focus and coaching.

### Recruiter Question Prep

Members work through a short checklist of recruiter questions and keep notes from conversations.

The app also recommends the next branch-specific standards question to ask a recruiter.

### 7-Day Training Orders

Members receive a seven-day plan based on branch, ship-date pressure, the latest PT score, available minutes, equipment access, and soreness. The plan picks a primary focus, includes daily work, and adds recovery guidance.

## Military Standards Engine

The standards intelligence layer lives in `src/lib/military-standards.ts` and is documented in `docs/military-standards-engine.md`.

Current scope:

- Supported branches: Army, Navy, Air Force, Marine Corps, Coast Guard, Space Force
- Assessment names, current source links, event focus, and recruiter prompts
- MVP readiness bands for push-ups, plank seconds, and run time

Validation:

```bash
pnpm test
```

## Fitness Engine

The training plan layer lives in `src/lib/fitness-engine.ts` and is documented in `docs/fitness-engine.md`.

Current scope:

- PT weak-point selection from push-ups, plank seconds, and run time
- Baseline mode when no score exists
- Taper mode inside 10 days of ship date
- Adaptive controls for minutes, equipment, and soreness
- Seven-day plans with recovery notes and branch assessment context

## Habit System

The readiness scoring layer lives in `src/lib/habit-engine.ts` and is documented in `docs/habit-system.md`.

Current scope:

- Complete-day streak and seven-day lock count
- Domain scores for physical, nutrition, knowledge, discipline, and recovery
- Weak-domain detection and next action
- Integration with PT readiness and soreness

## Analytics Engine

The risk and retention layer lives in `src/lib/analytics-engine.ts` and is documented in `docs/analytics-engine.md`.

Current scope:

- Retention score and risk level
- Signal table for habits, PT, recruiter prep, soreness, and ship date
- Recruiter prep completion rate
- Priority reasons and next best action
- Member header and admin snapshot integration

## Whop App Paths

Configure these paths in the Whop developer dashboard:

- Experience View: `/experiences/[experienceId]`
- Dashboard View: `/dashboard/[companyId]`

These match Whop's recommended app-view routes. Whop replaces `[experienceId]` with an `exp_...` ID and `[companyId]` with a `biz_...` ID.

## Local Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs through the Whop development proxy. Use this when testing inside Whop.

For a plain Next.js preview:

```bash
pnpm dev:next
```

Then open:

- Local preview: `http://localhost:3000/muster`
- Member Whop view: `http://localhost:3000/experiences/demo`
- Admin Whop view: `http://localhost:3000/dashboard/demo`
- Admin fallback: `http://localhost:3000/dashboard`

Direct browser access to Whop-gated routes shows the access-required state unless the request is coming through Whop's localhost dev proxy with a valid iframe user token.

## Deployment Preflight

Before pushing to GitHub for Vercel deployment:

```bash
pnpm deploy:preflight
```

This runs tests, lint, and the production Next.js build.

## Whop API Setup

Required server-only environment variables:

```bash
WHOP_API_KEY=...
WHOP_APP_ID=app_...
```

Do not expose `WHOP_API_KEY` in browser code or use a `NEXT_PUBLIC_` prefix. This project keeps Whop SDK calls on the server.

## Current Persistence

The Muster tools currently use browser local storage for fast MVP preview.

Before using this for real member reporting, replace local storage with a server database table set for:

- Members
- Ship dates
- Daily accountability check-ins
- PT logs
- Recruiter prep notes

Good production options: Supabase Postgres, Neon Postgres, PlanetScale, or another hosted database connected to the Next.js API layer.

## Deploy Inside Whop

The production path is GitHub -> Vercel -> Whop. Full instructions live in `docs/deployment-github-vercel-whop.md`.

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Set Vercel Root Directory to `progress-engine`.
4. Set Vercel environment variables from `.env.example`.
5. Deploy to Vercel.
6. In Whop's Hosting section, set the deployed Vercel production URL as the base URL.
7. Configure app views:

- Experience View: `/experiences/[experienceId]`
- Dashboard View: `/dashboard/[companyId]`

8. Open the Permissions tab and add any permissions required by the API endpoints your app uses.
9. Install the app into a test Whop with the install link.
10. Test the Experience View from the Whop sidebar and Dashboard View from the business dashboard apps section.

If Whop says the app refused to connect:

- Open the Vercel production URL directly and make sure it does not require a Vercel login.
- Disable Vercel Deployment Protection for production or use an unprotected production domain.
- Confirm Vercel Root Directory is `progress-engine`.
- Redeploy after changing environment variables or headers.

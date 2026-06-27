"use client";

import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  ExternalLink,
  Flame,
  Gauge,
  MessageSquareText,
  Save,
  Shield,
  Timer,
} from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";
import {
  branches,
  getStandardsForBranch,
  readinessBand,
  readinessCoaching,
} from "@/lib/military-standards";
import { habitReadiness } from "@/lib/habit-engine";
import {
  defaultTrainingConstraints,
  generateSevenDayTrainingPlan,
  normalizeConstraints,
  type TrainingConstraints,
} from "@/lib/fitness-engine";
import { memberAnalytics } from "@/lib/analytics-engine";

type MusterMode = "member" | "admin" | "preview";

type DailyLog = {
  date: string;
  nutrition: boolean;
  noExcuses: boolean;
  prep: boolean;
  pt: boolean;
};

type PtLog = {
  date: string;
  plankSeconds: number;
  pushups: number;
  runMinutes: number;
  runSeconds: number;
};

type RecruiterQuestion = {
  answered: boolean;
  custom?: boolean;
  id: string;
  note: string;
  text: string;
};

type MusterState = {
  branch: string;
  dailyLogs: DailyLog[];
  goal: string;
  name: string;
  ptLogs: PtLog[];
  recruiterQuestions: RecruiterQuestion[];
  shipDate: string;
  trainingConstraints: TrainingConstraints;
};

const defaultQuestions: RecruiterQuestion[] = [
  {
    answered: false,
    id: "job-guarantee",
    note: "",
    text: "What job or rate is guaranteed in writing before I sign?",
  },
  {
    answered: false,
    id: "ship-date",
    note: "",
    text: "What is my expected ship date and what could change it?",
  },
  {
    answered: false,
    id: "requirements",
    note: "",
    text: "What PT, weight, and conduct standards must I maintain before shipping?",
  },
  {
    answered: false,
    custom: true,
    id: "custom-1",
    note: "",
    text: "",
  },
  {
    answered: false,
    custom: true,
    id: "custom-2",
    note: "",
    text: "",
  },
  {
    answered: false,
    custom: true,
    id: "custom-3",
    note: "",
    text: "",
  },
];

const today = () => new Date().toISOString().slice(0, 10);

const blankState = (): MusterState => ({
  branch: "Army",
  dailyLogs: [],
  goal: "Ship ready, no excuses.",
  name: "Recruit",
  ptLogs: [],
  recruiterQuestions: defaultQuestions.map((question) => ({ ...question })),
  shipDate: "",
  trainingConstraints: defaultTrainingConstraints,
});

const storageKey = (id: string) => `the-muster-suite:${id}`;

function normalizeState(state: MusterState): MusterState {
  const existingById = new Map(state.recruiterQuestions.map((question) => [question.id, question]));

  return {
    ...state,
    recruiterQuestions: defaultQuestions.map((question) => {
      const existing = existingById.get(question.id);
      return {
        ...question,
        answered: existing?.answered ?? question.answered,
        note: existing?.note ?? question.note,
        text: question.custom ? existing?.text ?? question.text : question.text,
      };
    }),
    trainingConstraints: normalizeConstraints(state.trainingConstraints),
  };
}

function daysUntil(dateString: string) {
  if (!dateString) return undefined;
  const start = new Date(`${today()}T12:00:00`);
  const end = new Date(`${dateString}T12:00:00`);
  return Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
}

function timeLabel(totalDays?: number) {
  if (totalDays === undefined) return "Set ship date";
  if (totalDays < 0) return "Shipped";
  if (totalDays === 0) return "Today";
  return `${totalDays} days`;
}

function weeklyFocus(totalDays?: number) {
  if (totalDays === undefined) return "Lock in your branch, date, and baseline habits.";
  if (totalDays > 60) return "Build the habit: train, study, sleep, repeat.";
  if (totalDays > 30) return "Tighten weak points and protect your routine.";
  if (totalDays > 14) return "Practice standards. No missed check-ins.";
  if (totalDays >= 0) return "Final prep: documents, recovery, and composure.";
  return "Use the dashboard to review readiness and next steps.";
}

function currentStreak(logs: DailyLog[]) {
  const byDate = new Set(logs.filter(isCompleteDay).map((log) => log.date));
  let streak = 0;
  const cursor = new Date(`${today()}T12:00:00`);

  while (byDate.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function isCompleteDay(log: DailyLog) {
  return log.nutrition && log.noExcuses && log.prep && log.pt;
}

function latest<T>(items: T[]) {
  return items.at(-1);
}

function runTotalSeconds(log?: PtLog) {
  if (!log) return undefined;
  return log.runMinutes * 60 + log.runSeconds;
}

function readiness(log?: PtLog) {
  if (!log) return "No PT logged";
  const runSeconds = runTotalSeconds(log) ?? 99_999;
  return readinessBand(log.pushups, log.plankSeconds, runSeconds);
}

function formatRun(seconds?: number) {
  if (seconds === undefined) return "--";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function MusterSuite({ id, mode }: { id: string; mode: MusterMode }) {
  const [state, setState] = useState<MusterState>(blankState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    window.setTimeout(() => {
      if (cancelled) return;

      const stored = window.localStorage.getItem(storageKey(id));
      if (stored) {
        setState(normalizeState(JSON.parse(stored) as MusterState));
      }
      setReady(true);
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(storageKey(id), JSON.stringify(state));
    }
  }, [id, ready, state]);

  const remainingDays = daysUntil(state.shipDate);
  const todayLog = state.dailyLogs.find((log) => log.date === today());
  const completeDays = state.dailyLogs.filter(isCompleteDay).length;
  const streak = currentStreak(state.dailyLogs);
  const lastPt = latest(state.ptLogs);
  const readinessStatus = readiness(lastPt);
  const habits = habitReadiness({
    logs: state.dailyLogs,
    ptReadiness: readinessStatus,
    soreness: state.trainingConstraints.soreness,
    today: today(),
  });
  const recruiterDone = state.recruiterQuestions.filter((question) => question.answered).length;
  const standards = getStandardsForBranch(state.branch);
  const trainingPlan = generateSevenDayTrainingPlan({
    baseline: lastPt
      ? {
          plankSeconds: lastPt.plankSeconds,
          pushups: lastPt.pushups,
          runSeconds: runTotalSeconds(lastPt) ?? 0,
        }
      : undefined,
    branch: state.branch,
    constraints: state.trainingConstraints,
    daysUntilShip: remainingDays,
  });
  const analytics = memberAnalytics({
    daysUntilShip: remainingDays,
    habitReadiness: habits,
    ptReadiness: readinessStatus,
    recruiterAnswered: recruiterDone,
    recruiterTotal: state.recruiterQuestions.length,
    soreness: state.trainingConstraints.soreness,
    trainingFocus: trainingPlan.primaryFocus,
  });

  function saveCountdown(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState((current) => ({
      ...current,
      branch: String(form.get("branch") || current.branch),
      goal: String(form.get("goal") || current.goal),
      name: String(form.get("name") || current.name),
      shipDate: String(form.get("shipDate") || current.shipDate),
    }));
  }

  function saveDaily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const log: DailyLog = {
      date: today(),
      nutrition: form.get("nutrition") === "on",
      noExcuses: form.get("noExcuses") === "on",
      prep: form.get("prep") === "on",
      pt: form.get("pt") === "on",
    };

    setState((current) => ({
      ...current,
      dailyLogs: [...current.dailyLogs.filter((item) => item.date !== log.date), log],
    }));
  }

  function savePt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const log: PtLog = {
      date: today(),
      plankSeconds: Number(form.get("plankSeconds") || 0),
      pushups: Number(form.get("pushups") || 0),
      runMinutes: Number(form.get("runMinutes") || 0),
      runSeconds: Number(form.get("runSeconds") || 0),
    };

    setState((current) => ({
      ...current,
      ptLogs: [...current.ptLogs, log],
    }));
  }

  function saveTrainingConstraints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setState((current) => ({
      ...current,
      trainingConstraints: normalizeConstraints({
        equipment: form.get("equipment") as TrainingConstraints["equipment"],
        minutesAvailable: Number(form.get("minutesAvailable")),
        soreness: form.get("soreness") as TrainingConstraints["soreness"],
      }),
    }));
  }

  function toggleQuestion(idToToggle: string) {
    setState((current) => ({
      ...current,
      recruiterQuestions: current.recruiterQuestions.map((question) =>
        question.id === idToToggle ? { ...question, answered: !question.answered } : question,
      ),
    }));
  }

  function saveQuestionNote(idToUpdate: string, note: string) {
    setState((current) => ({
      ...current,
      recruiterQuestions: current.recruiterQuestions.map((question) =>
        question.id === idToUpdate ? { ...question, note } : question,
      ),
    }));
  }

  function saveQuestionText(idToUpdate: string, text: string) {
    setState((current) => ({
      ...current,
      recruiterQuestions: current.recruiterQuestions.map((question) =>
        question.id === idToUpdate && question.custom ? { ...question, text } : question,
      ),
    }));
  }

  if (!ready) {
    return <main className="min-h-[100dvh] bg-[#f7f5ee]" />;
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f7f5ee] text-[#171717]">
      <section className="border-b border-black/10 bg-[#fffdf6]">
        <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-3 py-4 sm:px-5 lg:max-w-7xl lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#52645d]">
                The Muster
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-normal text-[#161616] sm:text-5xl">
                Ship ready tools
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-7 text-[#545454]">
                Five simple apps for recruits: countdown, accountability, PT tracking, training orders, and recruiter prep.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[640px]">
              <Stat icon={Timer} label="Ship date" value={timeLabel(remainingDays)} />
              <Stat icon={Flame} label="Streak" value={`${streak} days`} />
              <Stat icon={Dumbbell} label="Risk" value={analytics.riskLevel} />
              <Stat icon={ClipboardList} label="Recruiter" value={`${recruiterDone}/6`} />
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">
                Retention score
              </p>
              <p className="mt-1 text-3xl font-black">{analytics.retentionScore}%</p>
              <p className="mt-1 text-sm font-bold text-[#52645d]">{analytics.riskLevel} risk</p>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">
                Analytics next action
              </p>
              <p className="mt-1 text-base font-black leading-6">{analytics.nextAction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {analytics.signals.map((signal) => (
                  <span
                    className="rounded-md border border-[#c7d6cf] bg-[#edf3ef] px-2 py-1 text-xs font-black text-[#244f47]"
                    key={signal.label}
                  >
                    {signal.label}: {signal.value} / {signal.status}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-none gap-3 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:max-w-7xl lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:px-8">
        <section className="space-y-3 sm:space-y-5">
          <ToolPanel icon={CalendarDays} kicker="App 1" title="Ship Date Countdown">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveCountdown}>
              <TextField defaultValue={state.name} label="Name" name="name" type="text" />
              <label className="grid gap-2 text-sm font-bold">
                Branch
                <select
                  className="h-12 rounded-md border border-black/15 bg-white px-3 text-base font-normal outline-none focus:ring-2 focus:ring-[#9aa89f]"
                  defaultValue={state.branch}
                  name="branch"
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </label>
              <TextField defaultValue={state.shipDate} label="Ship date" name="shipDate" type="date" />
              <TextField defaultValue={state.goal} label="Focus statement" name="goal" type="text" />
              <button className="muster-button sm:col-span-2" type="submit">
                <Save aria-hidden className="h-4 w-4" />
                Save countdown
              </button>
            </form>
            <div className="mt-4 rounded-lg bg-[#edf3ef] p-4">
              <p className="text-sm font-bold text-[#52645d]">
                {state.name} / {state.branch}
              </p>
              <p className="mt-1 text-3xl font-black">{timeLabel(remainingDays)}</p>
              <p className="mt-2 text-sm leading-6 text-[#545454]">{weeklyFocus(remainingDays)}</p>
              <div className="mt-4 rounded-md border border-black/10 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">
                      Current standard
                    </p>
                    <p className="mt-1 text-base font-black">{standards.assessment}</p>
                  </div>
                  <a
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-black/15 px-3 text-sm font-black transition hover:bg-[#edf3ef]"
                    href={standards.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden className="h-4 w-4" />
                    Source
                  </a>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#545454]">{standards.nextAction}</p>
              </div>
            </div>
          </ToolPanel>

          <ToolPanel icon={BadgeCheck} kicker="App 2" title="Daily Accountability Check-In">
            <form className="grid gap-3" onSubmit={saveDaily}>
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckTile defaultChecked={todayLog?.pt} label="PT done" name="pt" />
                <CheckTile defaultChecked={todayLog?.nutrition} label="Nutrition on track" name="nutrition" />
                <CheckTile defaultChecked={todayLog?.prep} label="Studied or prepared" name="prep" />
                <CheckTile defaultChecked={todayLog?.noExcuses} label="No excuses today" name="noExcuses" />
              </div>
              <button className="muster-button" type="submit">
                <CheckCircle2 aria-hidden className="h-4 w-4" />
                Lock today
              </button>
            </form>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniCard label="Complete days" value={String(completeDays)} />
              <MiniCard label="Current streak" value={`${streak}`} />
              <MiniCard label="Today" value={todayLog && isCompleteDay(todayLog) ? "Locked" : "Open"} />
            </div>
            <div className="mt-4 rounded-lg bg-[#edf3ef] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-[#52645d]">
                    Habit readiness
                  </p>
                  <p className="mt-1 text-3xl font-black">{habits.score}%</p>
                  <p className="mt-1 text-sm font-bold text-[#52645d]">{habits.band}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:min-w-56">
                  <MiniCard label="7-day locks" value={`${habits.weeklyCompleteDays}/7`} />
                  <MiniCard label="Weak point" value={domainLabel(habits.weakDomain)} />
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {habits.domains.map((domain) => (
                  <div className="rounded-md border border-black/10 bg-white p-2" key={domain.domain}>
                    <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">
                      <span>{domain.label}</span>
                      <span>{domain.score}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e3e0d7]">
                      <div
                        className="h-full rounded-full bg-[#1f5d52]"
                        style={{ width: `${domain.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-md bg-white p-3 text-sm font-bold leading-6 text-[#545454]">
                Next action: {habits.action}
              </p>
            </div>
          </ToolPanel>

          <ToolPanel icon={Dumbbell} kicker="App 5" title="7-Day Training Orders">
            <form className="mb-3 grid gap-3 sm:grid-cols-3" onSubmit={saveTrainingConstraints}>
              <TextField
                defaultValue={String(trainingPlan.constraints.minutesAvailable)}
                label="Minutes"
                max="90"
                min="15"
                name="minutesAvailable"
                step="5"
              />
              <label className="grid gap-2 text-sm font-bold">
                Equipment
                <select
                  className="h-12 rounded-md border border-black/15 bg-white px-3 text-base font-normal outline-none focus:ring-2 focus:ring-[#9aa89f]"
                  defaultValue={trainingPlan.constraints.equipment}
                  name="equipment"
                >
                  <option value="none">None</option>
                  <option value="basic">Basic</option>
                  <option value="full">Full</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Soreness
                <select
                  className="h-12 rounded-md border border-black/15 bg-white px-3 text-base font-normal outline-none focus:ring-2 focus:ring-[#9aa89f]"
                  defaultValue={trainingPlan.constraints.soreness}
                  name="soreness"
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </label>
              <button className="muster-button sm:col-span-3" type="submit">
                <Save aria-hidden className="h-4 w-4" />
                Adapt plan
              </button>
            </form>
            <div className="rounded-lg bg-[#edf3ef] p-4">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#52645d]">
                Primary focus
              </p>
              <p className="mt-1 text-2xl font-black capitalize">{trainingPlan.primaryFocus}</p>
              <p className="mt-2 text-sm leading-6 text-[#545454]">
                {trainingPlan.branchAssessment} / {trainingPlan.readiness}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trainingPlan.adaptationSummary.map((item) => (
                  <span
                    className="rounded-md border border-[#c7d6cf] bg-white px-2 py-1 text-xs font-black capitalize text-[#244f47]"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 grid gap-3">
              {trainingPlan.sessions.map((session) => (
                <div className="rounded-lg border border-black/10 bg-white p-3" key={session.day}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">
                        Day {session.day}
                      </p>
                      <p className="mt-1 text-base font-black">{session.title}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[#f4efe3] px-2 py-1 text-xs font-black capitalize text-[#6d5b38]">
                      {session.focus}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm leading-6 text-[#545454]">
                    {session.work.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-3 rounded-md bg-[#fffdf6] p-2 text-xs font-bold leading-5 text-[#5c523c]">
                    Recovery: {session.recovery}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-[#6d6d6d]">{trainingPlan.caution}</p>
          </ToolPanel>
        </section>

        <section className="space-y-3 sm:space-y-5">
          <ToolPanel icon={Gauge} kicker="App 3" title="PT Score Tracker">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={savePt}>
              <TextField label="Push-ups" min="0" name="pushups" step="1" />
              <TextField label="Plank seconds" min="0" name="plankSeconds" step="1" />
              <TextField label="Run minutes" min="0" name="runMinutes" step="1" />
              <TextField label="Run seconds" max="59" min="0" name="runSeconds" step="1" />
              <button className="muster-button sm:col-span-2" type="submit">
                <Dumbbell aria-hidden className="h-4 w-4" />
                Save PT score
              </button>
            </form>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniCard label="Push-ups" value={lastPt ? String(lastPt.pushups) : "--"} />
              <MiniCard label="Plank" value={lastPt ? `${lastPt.plankSeconds}s` : "--"} />
              <MiniCard label="Run" value={formatRun(runTotalSeconds(lastPt))} />
            </div>
            <div className="mt-3 rounded-lg bg-[#f4efe3] p-4">
              <p className="text-sm font-bold text-[#6d5b38]">Readiness call</p>
              <p className="mt-1 text-2xl font-black">{readinessStatus}</p>
              <p className="mt-2 text-sm leading-6 text-[#5c523c]">
                {readinessCoaching(readinessStatus, state.branch)}
              </p>
            </div>
            <div className="mt-3 rounded-lg border border-black/10 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">
                {state.branch} event focus
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {standards.events.map((event) => (
                  <span
                    className="rounded-md border border-[#c7d6cf] bg-[#edf3ef] px-2 py-1 text-xs font-black text-[#244f47]"
                    key={event}
                  >
                    {event}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-[#545454]">{standards.effective}</p>
            </div>
          </ToolPanel>

          <ToolPanel icon={MessageSquareText} kicker="App 4" title="Recruiter Question Prep">
            <div className="mb-3 rounded-lg border border-black/10 bg-[#edf3ef] p-3">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#52645d]">
                Ask this next
              </p>
              <p className="mt-1 text-sm font-bold leading-6">{standards.recruiterPrompt}</p>
            </div>
            <div className="space-y-3">
              {state.recruiterQuestions.map((question) => (
                <div className="rounded-lg border border-black/10 bg-white p-3" key={question.id}>
                  <label className="flex items-start gap-3 text-sm font-bold leading-6">
                    <input
                      checked={question.answered}
                      className="mt-1 h-4 w-4 accent-[#1f5d52]"
                      onChange={() => toggleQuestion(question.id)}
                      type="checkbox"
                    />
                    {question.custom ? (
                      <input
                        className="min-h-10 min-w-0 flex-1 rounded-md border border-black/15 bg-[#fffdf6] px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-[#9aa89f]"
                        onChange={(event) => saveQuestionText(question.id, event.target.value)}
                        placeholder="Write your own recruiter question"
                        type="text"
                        value={question.text}
                      />
                    ) : (
                      <span>{question.text}</span>
                    )}
                  </label>
                  <textarea
                    className="mt-3 min-h-16 w-full resize-y rounded-md border border-black/15 bg-[#fffdf6] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#9aa89f]"
                    onChange={(event) => saveQuestionNote(question.id, event.target.value)}
                    placeholder="Notes from recruiter"
                    value={question.note}
                  />
                </div>
              ))}
            </div>
          </ToolPanel>
        </section>
      </div>

      {mode === "admin" ? (
        <section className="mx-auto w-full max-w-none px-3 pb-5 sm:px-5 lg:max-w-7xl lg:px-8">
          <ToolPanel icon={Shield} kicker="Admin" title="Muster Snapshot">
            <div className="grid gap-3 sm:grid-cols-4">
              <MiniCard label="Member" value={state.name} />
              <MiniCard label="Branch" value={state.branch} />
              <MiniCard label="Retention" value={`${analytics.retentionScore}%`} />
              <MiniCard label="Risk" value={analytics.riskLevel} />
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border border-black/10">
              <table className="min-w-[560px] w-full border-collapse text-left text-sm">
                <thead className="bg-[#edf3ef] text-xs uppercase tracking-[0.08em] text-[#52645d]">
                  <tr>
                    <th className="px-3 py-3">Signal</th>
                    <th className="px-3 py-3">Value</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.signals.map((signal) => (
                    <tr className="border-t border-black/10" key={signal.label}>
                      <td className="px-3 py-3 font-bold">{signal.label}</td>
                      <td className="px-3 py-3 text-[#545454]">{signal.value}</td>
                      <td className="px-3 py-3 text-[#545454]">{signal.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-lg bg-[#f4efe3] p-4">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6d5b38]">
                Priority reasons
              </p>
              <ul className="mt-2 space-y-1 text-sm font-bold leading-6 text-[#5c523c]">
                {analytics.priorityReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </ToolPanel>
        </section>
      ) : null}
    </main>
  );
}

function domainLabel(domain: string) {
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function ToolPanel({
  children,
  icon: Icon,
  kicker,
  title,
}: {
  children: ReactNode;
  icon: typeof CalendarDays;
  kicker: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-black/10 bg-[#fffdf6] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1f5d52] text-white">
          <Icon aria-hidden className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#52645d]">{kicker}</p>
          <h2 className="text-lg font-black sm:text-xl">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-lg border border-black/10 bg-white p-3 shadow-sm">
      <Icon aria-hidden className="h-4 w-4 text-[#1f5d52]" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">{label}</p>
      <p className="mt-1 break-words text-base font-black sm:text-lg">{value}</p>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6d6d6d]">{label}</p>
      <p className="mt-1 break-words text-xl font-black">{value}</p>
    </div>
  );
}

function CheckTile({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-14 items-center gap-3 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold">
      <input className="h-4 w-4 accent-[#1f5d52]" defaultChecked={defaultChecked} name={name} type="checkbox" />
      {label}
    </label>
  );
}

function TextField({
  defaultValue,
  label,
  name,
  type = "number",
  ...props
}: {
  defaultValue?: string;
  label: string;
  name: string;
  type?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="h-12 min-w-0 rounded-md border border-black/15 bg-white px-3 text-base font-normal outline-none focus:ring-2 focus:ring-[#9aa89f]"
        defaultValue={defaultValue}
        name={name}
        type={type}
        {...props}
      />
    </label>
  );
}

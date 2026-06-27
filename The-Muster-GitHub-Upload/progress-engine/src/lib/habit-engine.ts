import type { PtReadinessBand } from "./military-standards.ts";
import type { SorenessLevel } from "./fitness-engine.ts";

export type HabitLog = {
  date: string;
  nutrition: boolean;
  noExcuses: boolean;
  prep: boolean;
  pt: boolean;
};

export type HabitDomain = "physical" | "nutrition" | "knowledge" | "discipline" | "recovery";

export type HabitScore = {
  domain: HabitDomain;
  label: string;
  score: number;
  weight: number;
};

export type HabitReadiness = {
  action: string;
  band: "At risk" | "Building" | "Locked in";
  domains: HabitScore[];
  score: number;
  streak: number;
  weakDomain: HabitDomain;
  weeklyCompleteDays: number;
};

const DOMAIN_WEIGHTS: Record<HabitDomain, number> = {
  discipline: 15,
  knowledge: 20,
  nutrition: 20,
  physical: 30,
  recovery: 15,
};

const DOMAIN_LABELS: Record<HabitDomain, string> = {
  discipline: "Discipline",
  knowledge: "Knowledge",
  nutrition: "Nutrition",
  physical: "Physical",
  recovery: "Recovery",
};

export function habitReadiness({
  logs,
  ptReadiness,
  soreness,
  today,
}: {
  logs: HabitLog[];
  ptReadiness: PtReadinessBand;
  soreness: SorenessLevel;
  today: string;
}): HabitReadiness {
  const windowLogs = logsForWindow(logs, today, 7);
  const todayLog = logs.find((log) => log.date === today);
  const domains = buildDomainScores(windowLogs, todayLog, ptReadiness, soreness);
  const score = Math.round(domains.reduce((total, domain) => total + (domain.score * domain.weight) / 100, 0));
  const weakDomain = domains.reduce((weakest, domain) =>
    domain.score < weakest.score ? domain : weakest,
  ).domain;

  return {
    action: habitAction(weakDomain, todayLog),
    band: score >= 85 ? "Locked in" : score >= 60 ? "Building" : "At risk",
    domains,
    score,
    streak: currentHabitStreak(logs, today),
    weakDomain,
    weeklyCompleteDays: windowLogs.filter(isCompleteHabitDay).length,
  };
}

export function currentHabitStreak(logs: HabitLog[], today: string) {
  const completeDates = new Set(logs.filter(isCompleteHabitDay).map((log) => log.date));
  const cursor = new Date(`${today}T12:00:00`);
  let streak = 0;

  while (completeDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function isCompleteHabitDay(log: HabitLog) {
  return log.nutrition && log.noExcuses && log.prep && log.pt;
}

function buildDomainScores(
  logs: HabitLog[],
  todayLog: HabitLog | undefined,
  ptReadiness: PtReadinessBand,
  soreness: SorenessLevel,
): HabitScore[] {
  const physicalBase = ratioScore(logs, "pt");
  const readinessBoost = ptReadiness === "Ready" ? 10 : ptReadiness === "Passing" ? 5 : 0;
  const recoveryScore = soreness === "low" ? 100 : soreness === "moderate" ? 70 : 45;

  return [
    domain("physical", Math.min(physicalBase + readinessBoost, 100)),
    domain("nutrition", ratioScore(logs, "nutrition")),
    domain("knowledge", ratioScore(logs, "prep")),
    domain("discipline", ratioScore(logs, "noExcuses")),
    domain("recovery", todayLog?.pt ? recoveryScore : Math.min(recoveryScore + 10, 100)),
  ];
}

function domain(domainName: HabitDomain, score: number): HabitScore {
  return {
    domain: domainName,
    label: DOMAIN_LABELS[domainName],
    score: Math.round(score),
    weight: DOMAIN_WEIGHTS[domainName],
  };
}

function ratioScore(logs: HabitLog[], key: keyof Pick<HabitLog, "nutrition" | "noExcuses" | "prep" | "pt">) {
  if (logs.length === 0) return 0;
  return Math.round((logs.filter((log) => log[key]).length / logs.length) * 100);
}

function logsForWindow(logs: HabitLog[], today: string, days: number) {
  const dates = new Set<string>();
  const cursor = new Date(`${today}T12:00:00`);

  for (let index = 0; index < days; index += 1) {
    dates.add(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }

  return logs.filter((log) => dates.has(log.date));
}

function habitAction(weakDomain: HabitDomain, todayLog?: HabitLog) {
  if (!todayLog) return "Lock today before the day gets away from you.";
  if (weakDomain === "physical") return "Finish today's training or recovery movement.";
  if (weakDomain === "nutrition") return "Get the next meal back on plan.";
  if (weakDomain === "knowledge") return "Complete one study block or recruiter-prep note.";
  if (weakDomain === "discipline") return "Close the day clean: no shortcuts, no excuses.";
  return "Protect sleep, mobility, and soreness before adding more volume.";
}

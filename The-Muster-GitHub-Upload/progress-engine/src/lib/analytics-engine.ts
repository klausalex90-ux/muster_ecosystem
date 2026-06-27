import type { HabitReadiness } from "./habit-engine.ts";
import type { PtReadinessBand } from "./military-standards.ts";
import type { SorenessLevel, TrainingFocus } from "./fitness-engine.ts";

export type AnalyticsRiskLevel = "Low" | "Moderate" | "High";

export type AnalyticsSignal = {
  label: string;
  status: "Clear" | "Watch" | "Action";
  value: string;
};

export type MemberAnalytics = {
  nextAction: string;
  priorityReasons: string[];
  recruiterPrepRate: number;
  retentionScore: number;
  riskLevel: AnalyticsRiskLevel;
  signals: AnalyticsSignal[];
};

export function memberAnalytics({
  daysUntilShip,
  habitReadiness,
  ptReadiness,
  recruiterAnswered,
  recruiterTotal,
  soreness,
  trainingFocus,
}: {
  daysUntilShip?: number;
  habitReadiness: HabitReadiness;
  ptReadiness: PtReadinessBand;
  recruiterAnswered: number;
  recruiterTotal: number;
  soreness: SorenessLevel;
  trainingFocus: TrainingFocus;
}): MemberAnalytics {
  const recruiterPrepRate = recruiterTotal <= 0 ? 0 : Math.round((recruiterAnswered / recruiterTotal) * 100);
  const riskPoints = riskScore({
    daysUntilShip,
    habitReadiness,
    ptReadiness,
    recruiterPrepRate,
    soreness,
  });
  const retentionScore = Math.max(0, Math.min(100, 100 - riskPoints));
  const priorityReasons = buildPriorityReasons({
    daysUntilShip,
    habitReadiness,
    ptReadiness,
    recruiterPrepRate,
    soreness,
  });
  const riskLevel = riskPoints >= 45 ? "High" : riskPoints >= 25 ? "Moderate" : "Low";

  return {
    nextAction: nextAction(priorityReasons, trainingFocus, habitReadiness.action),
    priorityReasons,
    recruiterPrepRate,
    retentionScore,
    riskLevel,
    signals: [
      signal("Habit readiness", `${habitReadiness.score}%`, habitReadiness.score >= 85 ? "Clear" : habitReadiness.score >= 60 ? "Watch" : "Action"),
      signal("PT readiness", ptReadiness, ptReadiness === "Ready" ? "Clear" : ptReadiness === "Passing" ? "Watch" : "Action"),
      signal("Recruiter prep", `${recruiterPrepRate}%`, recruiterPrepRate >= 80 ? "Clear" : recruiterPrepRate >= 50 ? "Watch" : "Action"),
      signal("Soreness", soreness, soreness === "low" ? "Clear" : soreness === "moderate" ? "Watch" : "Action"),
      signal("Ship date", shipDateValue(daysUntilShip), shipDateStatus(daysUntilShip)),
    ],
  };
}

function riskScore({
  daysUntilShip,
  habitReadiness,
  ptReadiness,
  recruiterPrepRate,
  soreness,
}: {
  daysUntilShip?: number;
  habitReadiness: HabitReadiness;
  ptReadiness: PtReadinessBand;
  recruiterPrepRate: number;
  soreness: SorenessLevel;
}) {
  let score = 0;

  score += habitReadiness.score < 60 ? 25 : habitReadiness.score < 85 ? 12 : 0;
  score += ptReadiness === "Needs work" || ptReadiness === "No PT logged" ? 20 : ptReadiness === "Passing" ? 8 : 0;
  score += recruiterPrepRate < 50 ? 15 : recruiterPrepRate < 80 ? 6 : 0;
  score += soreness === "high" ? 15 : soreness === "moderate" ? 6 : 0;
  score += daysUntilShip !== undefined && daysUntilShip >= 0 && daysUntilShip <= 14 ? 12 : 0;

  return score;
}

function buildPriorityReasons({
  daysUntilShip,
  habitReadiness,
  ptReadiness,
  recruiterPrepRate,
  soreness,
}: {
  daysUntilShip?: number;
  habitReadiness: HabitReadiness;
  ptReadiness: PtReadinessBand;
  recruiterPrepRate: number;
  soreness: SorenessLevel;
}) {
  const reasons: string[] = [];

  if (habitReadiness.score < 60) reasons.push("Habit readiness is below 60%.");
  else if (habitReadiness.score < 85) reasons.push("Habit readiness is not locked in yet.");

  if (ptReadiness === "No PT logged") reasons.push("No PT baseline has been logged.");
  else if (ptReadiness === "Needs work") reasons.push("PT baseline is below the MVP passing line.");
  else if (ptReadiness === "Passing") reasons.push("PT baseline is passing but not ready.");

  if (recruiterPrepRate < 50) reasons.push("Recruiter prep checklist is less than half complete.");
  else if (recruiterPrepRate < 80) reasons.push("Recruiter prep still has open questions.");

  if (soreness === "high") reasons.push("High soreness needs recovery-first management.");
  else if (soreness === "moderate") reasons.push("Moderate soreness should reduce volume.");

  if (daysUntilShip !== undefined && daysUntilShip >= 0 && daysUntilShip <= 14) {
    reasons.push("Ship date is inside the final 14-day window.");
  }

  return reasons.length > 0 ? reasons : ["Member is tracking cleanly across current signals."];
}

function nextAction(reasons: string[], trainingFocus: TrainingFocus, habitAction: string) {
  const baselineReason = reasons.find((reason) => reason.includes("No PT baseline"));
  const ptReason = reasons.find((reason) => reason.includes("PT baseline"));
  const recruiterReason = reasons.find((reason) => reason.includes("Recruiter prep"));
  const sorenessReason = reasons.find((reason) => reason.includes("soreness"));
  const shipReason = reasons.find((reason) => reason.includes("Ship date"));

  if (baselineReason) return "Get a PT baseline before the next coaching decision.";
  if (ptReason) return `Prioritize the ${trainingFocus} training block and retest this week.`;
  if (recruiterReason) return "Close the next recruiter question before the next meeting.";
  if (sorenessReason) return "Use recovery-first training and check soreness tomorrow.";
  if (shipReason) return "Switch to final-prep checklist and protect recovery.";

  return habitAction;
}

function signal(label: string, value: string, status: AnalyticsSignal["status"]): AnalyticsSignal {
  return {
    label,
    status,
    value,
  };
}

function shipDateValue(daysUntilShip?: number) {
  if (daysUntilShip === undefined) return "Not set";
  if (daysUntilShip < 0) return "Shipped";
  if (daysUntilShip === 0) return "Today";
  return `${daysUntilShip} days`;
}

function shipDateStatus(daysUntilShip?: number): AnalyticsSignal["status"] {
  if (daysUntilShip === undefined || daysUntilShip < 0) return "Watch";
  if (daysUntilShip <= 14) return "Action";
  if (daysUntilShip <= 30) return "Watch";
  return "Clear";
}

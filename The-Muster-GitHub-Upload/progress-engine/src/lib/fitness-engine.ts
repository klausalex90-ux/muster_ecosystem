import type { PtReadinessBand } from "./military-standards.ts";
import { getStandardsForBranch, readinessBand } from "./military-standards.ts";

export type PtBaseline = {
  plankSeconds: number;
  pushups: number;
  runSeconds: number;
};

export type TrainingFocus = "baseline" | "pushups" | "plank" | "run" | "balanced" | "taper";

export type EquipmentAccess = "none" | "basic" | "full";

export type SorenessLevel = "low" | "moderate" | "high";

export type TrainingConstraints = {
  equipment: EquipmentAccess;
  minutesAvailable: number;
  soreness: SorenessLevel;
};

export type TrainingSession = {
  day: number;
  focus: TrainingFocus;
  title: string;
  work: string[];
  recovery: string;
};

export type TrainingPlan = {
  adaptationSummary: string[];
  branchAssessment: string;
  caution: string;
  constraints: TrainingConstraints;
  generatedAt: string;
  primaryFocus: TrainingFocus;
  readiness: PtReadinessBand;
  sessions: TrainingSession[];
  sourceNote: string;
};

const GENERATED_AT = "2026-06-26";

export const defaultTrainingConstraints: TrainingConstraints = {
  equipment: "basic",
  minutesAvailable: 45,
  soreness: "low",
};

const equipmentOptions: EquipmentAccess[] = ["none", "basic", "full"];
const sorenessOptions: SorenessLevel[] = ["low", "moderate", "high"];

export function identifyPrimaryFocus(baseline?: PtBaseline, daysUntilShip?: number): TrainingFocus {
  if (daysUntilShip !== undefined && daysUntilShip >= 0 && daysUntilShip <= 10) return "taper";
  if (!baseline) return "baseline";

  const pushupGap = Math.max(45 - baseline.pushups, 0) / 45;
  const plankGap = Math.max(120 - baseline.plankSeconds, 0) / 120;
  const runGap = Math.max(baseline.runSeconds - 900, 0) / 900;

  if (pushupGap === 0 && plankGap === 0 && runGap === 0) return "balanced";

  const gaps: { focus: TrainingFocus; gap: number }[] = [
    { focus: "pushups", gap: pushupGap },
    { focus: "plank", gap: plankGap },
    { focus: "run", gap: runGap },
  ];

  return gaps.sort((a, b) => b.gap - a.gap)[0].focus;
}

export function generateSevenDayTrainingPlan({
  baseline,
  branch,
  constraints = defaultTrainingConstraints,
  daysUntilShip,
}: {
  baseline?: PtBaseline;
  branch: string;
  constraints?: Partial<TrainingConstraints>;
  daysUntilShip?: number;
}): TrainingPlan {
  const standards = getStandardsForBranch(branch);
  const resolvedConstraints = normalizeConstraints(constraints);
  const primaryFocus = identifyPrimaryFocus(baseline, daysUntilShip);
  const readiness = baseline
    ? readinessBand(baseline.pushups, baseline.plankSeconds, baseline.runSeconds)
    : "No PT logged";
  const sessions = adaptSessions(
    buildSessions(primaryFocus, standards.assessment),
    resolvedConstraints,
  );

  return {
    adaptationSummary: adaptationSummary(resolvedConstraints),
    branchAssessment: standards.assessment,
    caution:
      "Train hard, but do not train through sharp pain. Swap impact work for low-impact cardio when joints are irritated.",
    constraints: resolvedConstraints,
    generatedAt: GENERATED_AT,
    primaryFocus,
    readiness,
    sessions,
    sourceNote:
      "Built around progressive overload, aerobic base work, movement prep, recovery, and branch-event specificity.",
  };
}

export function normalizeConstraints(constraints: Partial<TrainingConstraints> = {}): TrainingConstraints {
  return {
    equipment: equipmentOptions.includes(constraints.equipment as EquipmentAccess)
      ? (constraints.equipment as EquipmentAccess)
      : defaultTrainingConstraints.equipment,
    minutesAvailable: clampMinutes(
      constraints.minutesAvailable ?? defaultTrainingConstraints.minutesAvailable,
    ),
    soreness: sorenessOptions.includes(constraints.soreness as SorenessLevel)
      ? (constraints.soreness as SorenessLevel)
      : defaultTrainingConstraints.soreness,
  };
}

function clampMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) return defaultTrainingConstraints.minutesAvailable;
  return Math.min(Math.max(Math.round(minutes), 15), 90);
}

function adaptSessions(sessions: TrainingSession[], constraints: TrainingConstraints) {
  let adapted = sessions.map((trainingSession) => ({
    ...trainingSession,
    recovery: adaptRecovery(trainingSession.recovery, constraints),
    work: adaptWork(trainingSession.work, constraints),
  }));

  if (constraints.soreness === "high") {
    adapted = adapted.map((trainingSession, index) =>
      index === 0
        ? session(
            trainingSession.day,
            "balanced",
            "Active recovery reset",
            [
              `${constraints.minutesAvailable} minutes easy walk, bike, or swim`,
              "Mobility for hips, calves, shoulders, and upper back",
              "Resume hard work only after soreness drops",
            ],
            "No max testing today. Sleep, hydrate, and monitor sharp pain.",
          )
        : trainingSession,
    );
  }

  return adapted;
}

function adaptWork(work: string[], constraints: TrainingConstraints) {
  const adapted = [...work];

  if (constraints.minutesAvailable <= 25) {
    adapted.unshift(`Time cap: finish the highest-quality work inside ${constraints.minutesAvailable} minutes.`);
  } else if (constraints.minutesAvailable >= 60) {
    adapted.unshift(`Extended block: add warm-up, cool-down, and easy skill practice inside ${constraints.minutesAvailable} minutes.`);
  }

  if (constraints.equipment === "none") {
    adapted.push("Equipment: use bodyweight, a backpack, stairs, or an outdoor route.");
  } else if (constraints.equipment === "basic") {
    adapted.push("Equipment: use bands, a pull-up bar, a backpack, or dumbbells if available.");
  }

  if (constraints.soreness === "moderate") {
    adapted.push("Soreness: reduce volume by 20% and keep every rep smooth.");
  }

  return adapted;
}

function adaptRecovery(recovery: string, constraints: TrainingConstraints) {
  const notes = [recovery];

  if (constraints.soreness === "moderate") {
    notes.push("Add extra mobility and avoid failure sets.");
  }

  if (constraints.soreness === "high") {
    notes.push("Treat today as recovery-first unless cleared by pain-free movement.");
  }

  if (constraints.minutesAvailable <= 25) {
    notes.push("Use any leftover time for breathing and a short walk.");
  }

  return notes.join(" ");
}

function adaptationSummary(constraints: TrainingConstraints) {
  const summary = [`${constraints.minutesAvailable}-minute sessions`];

  if (constraints.equipment === "none") {
    summary.push("bodyweight substitutions");
  } else if (constraints.equipment === "basic") {
    summary.push("basic-equipment options");
  } else {
    summary.push("full-equipment options");
  }

  if (constraints.soreness === "high") {
    summary.push("recovery-first today");
  } else if (constraints.soreness === "moderate") {
    summary.push("reduced volume");
  } else {
    summary.push("normal loading");
  }

  return summary;
}

function buildSessions(primaryFocus: TrainingFocus, assessment: string): TrainingSession[] {
  if (primaryFocus === "baseline") {
    return [
      session(1, "baseline", "Set the baseline", ["Warm up 10 minutes", "Test push-ups, plank, and run pace", "Record scores before extra work"], "Walk 10 minutes and stretch calves, hips, chest."),
      session(2, "balanced", "Technique rebuild", ["3 easy rounds: push-ups at clean form, bodyweight squats, dead bug holds", "Keep two reps in reserve"], "Light mobility and early sleep."),
      session(3, "run", "Aerobic base", ["20-30 minutes easy run or bike", "Finish with 4 relaxed strides if pain-free"], "Hydrate and elevate legs for 5 minutes."),
      session(4, "plank", "Core durability", ["5 rounds: plank hold, side plank left, side plank right", "Stop each hold before form breaks"], "Breathing reset and thoracic mobility."),
      session(5, "pushups", "Upper-body capacity", ["Ladder push-ups: 2-4-6-8 then back down", "Add rows or band pulls between sets"], "Shoulder mobility and easy walk."),
      session(6, "balanced", `${assessment} rehearsal`, ["Practice event order at 70% effort", "Write down the first event that fades"], "Long cool-down and protein-focused meal."),
      session(7, "balanced", "Recovery audit", ["30 minutes easy movement", "Review sleep, nutrition, soreness, and next weak point"], "No hard training today."),
    ];
  }

  if (primaryFocus === "taper") {
    return [
      session(1, "balanced", "Sharp, not sore", ["Warm up well", "2 easy rounds of each tested movement", "Stop every set fresh"], "Stretch lightly and keep bedtime consistent."),
      session(2, "run", "Pace touch", ["10 minutes easy", "4 short goal-pace pickups", "10 minutes easy"], "Hydrate and avoid new shoes."),
      session(3, "pushups", "Confidence reps", ["3 sets at 50-60% of best push-up set", "3 relaxed plank holds"], "Shoulders and hips only, no deep fatigue."),
      session(4, "balanced", "Movement prep", ["Walk or bike 25 minutes", "Practice breathing under control"], "Extra sleep window."),
      session(5, "plank", "Core primer", ["4 short plank holds with perfect form", "Easy mobility circuit"], "Stop before shaking or back tightness."),
      session(6, "balanced", "Pack and rehearse", ["Brief warm-up", "Review documents, route, and reporting time"], "No hard training."),
      session(7, "taper", "Arrive ready", ["Easy walk", "Fuel normally", "Keep nerves quiet"], "Trust the preparation."),
    ];
  }

  const emphasis = primaryFocus === "balanced" ? "run" : primaryFocus;

  return [
    session(1, emphasis, focusTitle(emphasis, "build"), focusWork(emphasis, "build"), "Cool down until breathing is normal, then stretch the trained area."),
    session(2, "balanced", "Strength and movement quality", ["3-4 rounds: squat or hinge, push, pull, carry", "Keep the final rep crisp"], "Eat a real meal and walk 10 minutes later."),
    session(3, "run", emphasis === "run" ? "Intervals for pace control" : "Easy aerobic base", emphasis === "run" ? ["6-8 repeats of 1 minute strong, 2 minutes easy", "No sprinting"] : ["25-35 minutes conversational pace", "Finish feeling better than you started"], "Calf and hip mobility."),
    session(4, "plank", "Core and trunk durability", ["5-8 quality plank holds", "Add side planks and dead bugs"], "Stop if low back takes over."),
    session(5, emphasis, focusTitle(emphasis, "volume"), focusWork(emphasis, "volume"), "Easy walk, fluids, and shoulder or hip care."),
    session(6, "balanced", `${assessment} event rehearsal`, ["Run the event order at 75-85% effort", "Do not chase a personal record today"], "Write the next weakest event in your notes."),
    session(7, "balanced", "Recovery and accountability", ["30-45 minutes low-intensity movement", "Prep training clothes and meals for tomorrow"], "Full recovery day if soreness is high."),
  ];
}

function focusTitle(focus: TrainingFocus, mode: "build" | "volume") {
  if (focus === "pushups") return mode === "build" ? "Push-up strength" : "Push-up volume";
  if (focus === "plank") return mode === "build" ? "Plank position strength" : "Plank endurance";
  if (focus === "run") return mode === "build" ? "Run base builder" : "Run pace repeat";
  return mode === "build" ? "Balanced readiness" : "Balanced volume";
}

function focusWork(focus: TrainingFocus, mode: "build" | "volume") {
  if (focus === "pushups") {
    return mode === "build"
      ? ["5 sets of clean push-ups at 60-70% max", "Pair each set with rows or band pulls"]
      : ["10-minute easy push-up density block", "Never hit failure"];
  }

  if (focus === "plank") {
    return mode === "build"
      ? ["6 plank holds at perfect form", "Rest twice as long as each hold"]
      : ["Accumulate 4-6 total minutes across plank variations", "Break before form fails"];
  }

  if (focus === "run") {
    return mode === "build"
      ? ["30 minutes easy aerobic work", "Keep the pace conversational"]
      : ["8-10 repeats of 30 seconds faster, 90 seconds easy", "Stay relaxed"];
  }

  return ["Train push-ups, core, and aerobic base without maxing out", "Leave energy for tomorrow"];
}

function session(day: number, focus: TrainingFocus, title: string, work: string[], recovery: string): TrainingSession {
  return {
    day,
    focus,
    recovery,
    title,
    work,
  };
}

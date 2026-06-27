export type MusterBranch =
  | "Army"
  | "Navy"
  | "Air Force"
  | "Marine Corps"
  | "Coast Guard"
  | "Space Force";

export type StandardsSource = {
  assessment: string;
  effective: string;
  events: string[];
  nextAction: string;
  recruiterPrompt: string;
  sourceLabel: string;
  sourceUrl: string;
  updatedAt: string;
};

export type PtReadinessBand = "No PT logged" | "Needs work" | "Passing" | "Ready";

export const branches: MusterBranch[] = [
  "Army",
  "Navy",
  "Air Force",
  "Marine Corps",
  "Coast Guard",
  "Space Force",
];

export const standardsUpdatedAt = "2026-06-26";

export const standardsByBranch: Record<MusterBranch, StandardsSource> = {
  Army: {
    assessment: "Army Fitness Test",
    effective: "Record test from 2025 guidance; verify accession-specific policy before ship.",
    events: ["3RM deadlift", "Hand-release push-up", "Sprint-drag-carry", "Plank", "2-mile run"],
    nextAction: "Build deadlift strength, push-up volume, loaded sprint capacity, plank endurance, and 2-mile pacing.",
    recruiterPrompt: "Which AFT standard applies to my MOS or accession path, and when will I take it?",
    sourceLabel: "U.S. Army AFT",
    sourceUrl: "https://www.army.mil/aft/",
    updatedAt: standardsUpdatedAt,
  },
  Navy: {
    assessment: "Physical Readiness Test",
    effective: "OPNAVINST 6110.1L and Navy Physical Readiness Program guidance.",
    events: ["Body composition", "Push-ups", "Forearm plank", "Cardio assessment"],
    nextAction: "Keep body composition inside accession range while training push-ups, plank, and run or cardio pacing.",
    recruiterPrompt: "Which PRT age group, cardio option, and body composition rule will be used for my program?",
    sourceLabel: "Navy Physical Readiness Program",
    sourceUrl: "https://www.mynavyhr.navy.mil/Support-Services/Culture-Resilience/Physical-Readiness/",
    updatedAt: standardsUpdatedAt,
  },
  "Air Force": {
    assessment: "Department of the Air Force Fitness Assessment",
    effective: "Fitness scoring tables include PFRA updates effective March 1, 2026.",
    events: ["Cardiorespiratory component", "Strength component", "Core component", "Authorized alternatives"],
    nextAction: "Train a primary run option plus push-up and core capacity, then confirm which alternatives are allowed.",
    recruiterPrompt: "Which PFRA component options are authorized for my entry path and first duty fitness assessment?",
    sourceLabel: "Air Force Fitness Program",
    sourceUrl: "https://www.afpc.af.mil/Career-Management/Fitness-Program/",
    updatedAt: standardsUpdatedAt,
  },
  "Marine Corps": {
    assessment: "Physical Fitness Test and Combat Fitness Test",
    effective: "PFT/CFT standards and calculator references should be checked against the current Marine Corps tables.",
    events: ["Pull-ups or push-ups", "Plank", "3-mile run", "Movement to contact", "Ammo-can lift", "Maneuver under fire"],
    nextAction: "Balance upper-body pulling or pushing, plank strength, 3-mile pacing, and high-output combat conditioning.",
    recruiterPrompt: "What PFT and CFT score class should I target before recruit training?",
    sourceLabel: "Marine Corps PFT/CFT Standards",
    sourceUrl: "https://www.fitness.marines.mil/PFT-CFT_Standards17/",
    updatedAt: standardsUpdatedAt,
  },
  "Coast Guard": {
    assessment: "Physical Fitness Assessment",
    effective: "Coast Guard PFA policy is maintained through PPC and program guidance.",
    events: ["Push-ups", "Core endurance", "Cardio assessment", "Swim or service-specific screening when required"],
    nextAction: "Train push-up endurance, core capacity, run pacing, and any school-specific swim requirement.",
    recruiterPrompt: "Which PFA and school-specific physical requirements apply to my rating or program?",
    sourceLabel: "Coast Guard PPC PFA update",
    sourceUrl: "https://www.dcms.uscg.mil/ppc/news/Article/4041831/chapter-4-physical-fitness-assessment-updated/",
    updatedAt: standardsUpdatedAt,
  },
  "Space Force": {
    assessment: "Guardian fitness and DAF fitness readiness",
    effective: "Guardian prep should verify current Space Force and Department of the Air Force requirements.",
    events: ["Cardiorespiratory readiness", "Strength readiness", "Core readiness", "Holistic health behaviors"],
    nextAction: "Prepare against DAF fitness events while building sustainable sleep, recovery, and movement habits.",
    recruiterPrompt: "Which Space Force or DAF fitness assessment applies before, during, and after basic training?",
    sourceLabel: "Air Force Fitness Program",
    sourceUrl: "https://www.afpc.af.mil/Career-Management/Fitness-Program/",
    updatedAt: standardsUpdatedAt,
  },
};

export function getStandardsForBranch(branch: string): StandardsSource {
  return standardsByBranch[isMusterBranch(branch) ? branch : "Army"];
}

export function isMusterBranch(branch: string): branch is MusterBranch {
  return branches.includes(branch as MusterBranch);
}

export function readinessBand(pushups: number, plankSeconds: number, runSeconds: number): Exclude<PtReadinessBand, "No PT logged"> {
  const ready = pushups >= 45 && plankSeconds >= 120 && runSeconds <= 900;
  const passing = pushups >= 30 && plankSeconds >= 90 && runSeconds <= 1080;

  if (ready) return "Ready";
  if (passing) return "Passing";
  return "Needs work";
}

export function readinessCoaching(band: PtReadinessBand, branch: string) {
  const standards = getStandardsForBranch(branch);

  if (band === "Ready") {
    return `You are above the MVP readiness line. Shift from survival prep to ${standards.assessment} event practice.`;
  }

  if (band === "Passing") {
    return `You are near the line. Prioritize the weakest event, then rehearse ${standards.assessment} pacing weekly.`;
  }

  if (band === "Needs work") {
    return `Build the floor first: push-ups, plank endurance, and aerobic base before attempting full ${standards.assessment} simulations.`;
  }

  return `Log a baseline PT score, then compare your next training block against ${standards.assessment} events.`;
}

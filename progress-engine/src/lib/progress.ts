export type BodyFatMethod = "bioimpedance" | "bod-pod" | "skin-calipers";

export type BaselineMetrics = {
  submittedAt: string;
  purchaseDate: string;
  heightInches: number;
  weightLbs: number;
  waistInches: number;
  bodyFatPercent: number;
  bodyFatMethod: BodyFatMethod;
};

export type DailyCheckIn = {
  day: number;
  dueDate: string;
  submittedAt: string;
  weightLbs: number;
  workoutCompleted: boolean;
  nutritionGoalsHit: boolean;
};

export type MonthlyUpdate = {
  month: 1 | 2 | 3;
  dueDate: string;
  submittedAt: string;
  weightLbs: number;
  waistInches: number;
  bodyFatPercent: number;
  bodyFatMethod: BodyFatMethod;
};

export type GraduationMetrics = {
  submittedAt: string;
  weightLbs: number;
  waistInches: number;
  bodyFatPercent: number;
  bodyFatMethod: BodyFatMethod;
};

export type ProgressState = {
  baseline?: BaselineMetrics;
  dailyCheckIns: DailyCheckIn[];
  monthlyUpdates: MonthlyUpdate[];
  graduation?: GraduationMetrics;
};

export type MemberRecord = {
  companyId: string;
  id: string;
  displayName: string;
  experienceId: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  state: ProgressState;
};

export type ProgramStore = {
  activeMemberId?: string;
  members: MemberRecord[];
};

export const PROGRAM_LENGTH_DAYS = 90;
export const REQUIRED_COMPLIANCE = 85;
export const REQUIRED_BODY_FAT_POINT_LOSS = 5;

export const bodyFatMethods: { value: BodyFatMethod; label: string }[] = [
  { value: "bioimpedance", label: "Bioimpedance scanner" },
  { value: "bod-pod", label: "Bod Pod" },
  { value: "skin-calipers", label: "Skin calipers" },
];

export function emptyProgressState(): ProgressState {
  return {
    dailyCheckIns: [],
    monthlyUpdates: [],
  };
}

export function emptyProgramStore(): ProgramStore {
  return {
    members: [],
  };
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function clampProgramDay(baseline?: BaselineMetrics) {
  if (!baseline) return 1;

  const start = new Date(`${baseline.submittedAt.slice(0, 10)}T12:00:00`);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;

  return Math.min(Math.max(elapsed, 1), PROGRAM_LENGTH_DAYS);
}

export function fullCheckInDeadline(baseline?: BaselineMetrics) {
  if (!baseline) return undefined;
  return addDays(baseline.purchaseDate, 2);
}

export function isBaselineOnTime(baseline?: BaselineMetrics) {
  if (!baseline) return false;

  const submitted = baseline.submittedAt.slice(0, 10);
  const deadline = fullCheckInDeadline(baseline);

  return Boolean(deadline && submitted <= deadline);
}

export function graduationDate(baseline?: BaselineMetrics) {
  if (!baseline) return undefined;
  return addDays(baseline.submittedAt.slice(0, 10), PROGRAM_LENGTH_DAYS - 1);
}

export function monthlyDueDate(baseline: BaselineMetrics, month: 1 | 2 | 3) {
  return addDays(baseline.submittedAt.slice(0, 10), month * 30 - 1);
}

export function currentMonthlyDue(baseline?: BaselineMetrics, submitted: MonthlyUpdate[] = []) {
  if (!baseline) return undefined;
  const day = clampProgramDay(baseline);

  if (day >= 30 && !submitted.some((update) => update.month === 1)) return 1;
  if (day >= 60 && !submitted.some((update) => update.month === 2)) return 2;
  if (day >= 90 && !submitted.some((update) => update.month === 3)) return 3;

  return undefined;
}

export function complianceSummary(state: ProgressState) {
  const dueDays = clampProgramDay(state.baseline);
  const submittedDays = new Set(state.dailyCheckIns.map((checkIn) => checkIn.day));
  const workoutDays = new Set(
    state.dailyCheckIns
      .filter((checkIn) => checkIn.workoutCompleted)
      .map((checkIn) => checkIn.day),
  );

  let compliantDays = 0;
  for (let day = 1; day <= dueDays; day += 1) {
    if (submittedDays.has(day) && workoutDays.has(day)) {
      compliantDays += 1;
    }
  }

  const missedWeighIns = dueDays - submittedDays.size;
  const missedWorkouts = dueDays - workoutDays.size;
  const complianceRate = dueDays === 0 ? 0 : Math.round((compliantDays / dueDays) * 100);

  return {
    compliantDays,
    complianceRate,
    dueDays,
    missedWeighIns,
    missedWorkouts,
    requiredRate: REQUIRED_COMPLIANCE,
  };
}

export function bodyCompositionSummary(state: ProgressState) {
  const baseline = state.baseline;
  const graduation = state.graduation;
  const latestMonthly = state.monthlyUpdates.at(-1);
  const latestWeight = state.dailyCheckIns.at(-1)?.weightLbs;

  const currentBodyFat = graduation?.bodyFatPercent ?? latestMonthly?.bodyFatPercent ?? baseline?.bodyFatPercent;
  const currentWeight = graduation?.weightLbs ?? latestWeight ?? latestMonthly?.weightLbs ?? baseline?.weightLbs;
  const currentWaist = graduation?.waistInches ?? latestMonthly?.waistInches ?? baseline?.waistInches;
  const bodyFatPointLoss =
    baseline && currentBodyFat !== undefined ? baseline.bodyFatPercent - currentBodyFat : 0;

  return {
    bodyFatPointLoss: Number(bodyFatPointLoss.toFixed(1)),
    currentBodyFat,
    currentWaist,
    currentWeight,
    fatMassStart:
      baseline === undefined ? undefined : Number(((baseline.weightLbs * baseline.bodyFatPercent) / 100).toFixed(1)),
    leanMassStart:
      baseline === undefined
        ? undefined
        : Number((baseline.weightLbs - (baseline.weightLbs * baseline.bodyFatPercent) / 100).toFixed(1)),
    waistLoss:
      baseline && currentWaist !== undefined ? Number((baseline.waistInches - currentWaist).toFixed(1)) : 0,
    weightLoss:
      baseline && currentWeight !== undefined ? Number((baseline.weightLbs - currentWeight).toFixed(1)) : 0,
  };
}

export function guaranteeSummary(state: ProgressState) {
  const compliance = complianceSummary(state);
  const body = bodyCompositionSummary(state);
  const metBodyFat = body.bodyFatPointLoss >= REQUIRED_BODY_FAT_POINT_LOSS;
  const metCompliance = compliance.complianceRate >= REQUIRED_COMPLIANCE;
  const graduated = Boolean(state.graduation);

  return {
    eligible: graduated && metBodyFat && metCompliance,
    graduated,
    metBodyFat,
    metCompliance,
    status: !graduated
      ? "In progress"
      : metBodyFat && metCompliance
        ? "Guarantee satisfied"
        : "Guarantee review needed",
  };
}

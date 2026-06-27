"use client";

import {
  Activity,
  BadgeCheck,
  CalendarCheck,
  ClipboardCheck,
  Dumbbell,
  FileCheck,
  Gauge,
  Goal,
  Lock,
  ShieldCheck,
  TrendingDown,
  Upload,
} from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BodyFatMethod,
  MemberRecord,
  MonthlyUpdate,
  ProgressState,
  bodyCompositionSummary,
  bodyFatMethods,
  clampProgramDay,
  complianceSummary,
  currentMonthlyDue,
  emptyProgressState,
  formatDate,
  fullCheckInDeadline,
  graduationDate,
  guaranteeSummary,
  isBaselineOnTime,
} from "@/lib/progress";

type AppMode = "member" | "admin";

type ProgressEngineProps = {
  id: string;
  mode: AppMode;
};

const numberValue = (form: FormData, key: string) => Number(form.get(key));

const today = () => formatDate(new Date());

export function ProgressEngine({ id, mode }: ProgressEngineProps) {
  const [member, setMember] = useState<MemberRecord>();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>();
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (cancelled) return;

      setReady(false);
      setError(undefined);

      try {
        const response =
          mode === "admin"
            ? await fetch(`/api/admin/${id}/members`)
            : await fetch(`/api/progress/${id}/me`);

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Whop access required.");
        }

        if (mode === "admin") {
          const payload = (await response.json()) as { members: MemberRecord[] };
          setMembers(payload.members);
          setSelectedMemberId((current) => current ?? payload.members[0]?.id);
        } else {
          const payload = (await response.json()) as { member: MemberRecord };
          setMember(payload.member);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Whop access required.");
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  const selectedMember =
    mode === "admin"
      ? members.find((currentMember) => currentMember.id === selectedMemberId) ?? members[0]
      : member;
  const state = selectedMember?.state ?? emptyProgressState();

  const compliance = useMemo(() => complianceSummary(state), [state]);
  const body = useMemo(() => bodyCompositionSummary(state), [state]);
  const guarantee = useMemo(() => guaranteeSummary(state), [state]);
  const programDay = clampProgramDay(state.baseline);
  const alreadyCheckedIn = state.dailyCheckIns.some((checkIn) => checkIn.day === programDay);
  const monthlyDue = currentMonthlyDue(state.baseline, state.monthlyUpdates);

  function selectMember(memberId: string) {
    setSelectedMemberId(memberId);
  }

  async function submitMemberUpdate(endpoint: string, body: unknown) {
    const response = await fetch(`/api/progress/${id}/${endpoint}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = (await response.json()) as { error?: string; member?: MemberRecord };
    if (!response.ok || !payload.member) {
      throw new Error(payload.error ?? "Unable to save this record.");
    }

    setMember(payload.member);
  }

  async function saveBaseline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const purchaseDate = String(form.get("purchaseDate") || today());

    await submitMemberUpdate("baseline", {
      purchaseDate,
      heightInches: numberValue(form, "heightInches"),
      weightLbs: numberValue(form, "weightLbs"),
      waistInches: numberValue(form, "waistInches"),
      bodyFatPercent: numberValue(form, "bodyFatPercent"),
      bodyFatMethod: form.get("bodyFatMethod") as BodyFatMethod,
    });
  }

  async function saveDaily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state.baseline || alreadyCheckedIn) return;

    const form = new FormData(event.currentTarget);

    await submitMemberUpdate("daily", {
      weightLbs: numberValue(form, "weightLbs"),
      workoutCompleted: form.get("workoutCompleted") === "on",
      nutritionGoalsHit: form.get("nutritionGoalsHit") === "on",
    });
  }

  async function saveMonthly(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state.baseline || !monthlyDue) return;

    const form = new FormData(event.currentTarget);

    await submitMemberUpdate("monthly", {
      weightLbs: numberValue(form, "weightLbs"),
      waistInches: numberValue(form, "waistInches"),
      bodyFatPercent: numberValue(form, "bodyFatPercent"),
      bodyFatMethod: form.get("bodyFatMethod") as BodyFatMethod,
    } satisfies Partial<MonthlyUpdate>);
  }

  async function saveGraduation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    await submitMemberUpdate("graduation", {
      weightLbs: numberValue(form, "weightLbs"),
      waistInches: numberValue(form, "waistInches"),
      bodyFatPercent: numberValue(form, "bodyFatPercent"),
      bodyFatMethod: form.get("bodyFatMethod") as BodyFatMethod,
    });
  }

  if (!ready) {
    return <main className="min-h-[100dvh] bg-[#f6f5ef]" />;
  }

  if (error) {
    return <AccessRequired message={error} mode={mode} />;
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f6f5ef] text-[#151515]">
      <section className="border-b border-black/10 bg-[#fbfaf5]">
        <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-3 py-4 sm:px-5 lg:max-w-7xl lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5d6b64]">
                90-day military prep
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-normal text-[#151515] sm:text-4xl">
                Body Fat Progress Engine
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-7 text-[#525252]">
                Baseline, daily compliance, monthly full updates, and graduation evidence for the 5
                percentage-point body-fat guarantee.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-2xl">
              <Metric icon={CalendarCheck} label="Program day" value={String(programDay)} />
              <Metric icon={Gauge} label="Compliance" value={`${compliance.complianceRate}%`} />
              <Metric icon={TrendingDown} label="BF lost" value={`${body.bodyFatPointLoss}%`} />
              <Metric icon={ShieldCheck} label="Guarantee" value={guarantee.status} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-none gap-3 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:max-w-7xl lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="min-w-0 space-y-3 sm:space-y-5">
          {mode === "admin" ? (
            <AdminPanel
              members={members}
              onSelectMember={selectMember}
              selectedMember={selectedMember}
            />
          ) : (
            <>
              {!state.baseline ? (
                <BaselineForm member={selectedMember} onSubmit={saveBaseline} />
              ) : (
                <>
                  <MemberHeader member={selectedMember} />
                  <StatusStrip state={state} />
                  <DailyForm
                    alreadyCheckedIn={alreadyCheckedIn}
                    defaultWeight={body.currentWeight}
                    onSubmit={saveDaily}
                    programDay={programDay}
                  />
                  {monthlyDue ? (
                    <MonthlyForm
                      month={monthlyDue as 1 | 2 | 3}
                      onSubmit={saveMonthly}
                      state={state}
                    />
                  ) : null}
                  {programDay >= 90 && !state.graduation ? (
                    <GraduationForm onSubmit={saveGraduation} state={state} />
                  ) : null}
                </>
              )}
            </>
          )}
        </div>

        <aside className="min-w-0 space-y-3 sm:space-y-5">
          <GuaranteePanel state={state} />
          <TimelinePanel state={state} />
          <EvidencePanel />
        </aside>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="min-h-24 min-w-0 rounded-lg border border-black/10 bg-white p-3 shadow-sm">
      <Icon aria-hidden className="h-4 w-4 text-[#2f6f63]" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6d6d6d]">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-bold leading-6 text-[#181818] sm:text-lg">
        {value}
      </p>
    </div>
  );
}

function Panel({
  children,
  title,
  icon: Icon,
}: {
  children: ReactNode;
  title: string;
  icon: typeof Activity;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2 sm:mb-5">
        <Icon aria-hidden className="h-5 w-5 text-[#2f6f63]" />
        <h2 className="min-w-0 text-lg font-bold tracking-normal sm:text-xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AccessRequired({ message, mode }: { message: string; mode: AppMode }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6f5ef] p-3 text-[#151515] sm:p-4">
      <section className="w-full max-w-xl rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock aria-hidden className="h-5 w-5 text-[#9a5b22]" />
          <h1 className="text-xl font-bold sm:text-2xl">Whop access required</h1>
        </div>
        <p className="text-sm leading-6 text-[#5f5f5f]">{message}</p>
        <p className="mt-4 text-sm leading-6 text-[#5f5f5f]">
          Open this {mode === "admin" ? "dashboard" : "experience"} through Whop or the Whop
          localhost dev proxy so the iframe request includes the signed Whop user token.
        </p>
      </section>
    </main>
  );
}

function MemberHeader({
  member,
}: {
  member?: MemberRecord;
}) {
  if (!member) return null;

  return (
    <section className="min-w-0 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6d6d6d]">
          Whop verified member
        </p>
        <p className="mt-1 break-words text-xl font-bold">{member.displayName}</p>
        <p className="mt-1 break-all text-xs text-[#606060]">{member.userId}</p>
      </div>
    </section>
  );
}

function BaselineForm({
  member,
  onSubmit,
}: {
  member?: MemberRecord;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel icon={ClipboardCheck} title="Start Assessment">
      <p className="mb-5 text-sm leading-6 text-[#5f5f5f]">
        Required within 48 hours of purchase. This record is tied to{" "}
        <span className="font-bold">{member?.displayName ?? "the verified Whop member"}</span> and
        cannot be created with a typed name.
      </p>
      <form className="grid gap-3 sm:grid-cols-2 sm:gap-4" onSubmit={onSubmit}>
        <Field label="Purchase date" name="purchaseDate" required type="date" defaultValue={today()} />
        <Field label="Height" min="48" name="heightInches" required step="0.5" suffix="in" />
        <Field label="Starting weight" min="50" name="weightLbs" required step="0.1" suffix="lb" />
        <Field label="Waist circumference" min="15" name="waistInches" required step="0.1" suffix="in" />
        <Field label="Body fat" max="70" min="3" name="bodyFatPercent" required step="0.1" suffix="%" />
        <MethodSelect />
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1f5d52] px-4 text-sm font-bold text-white transition hover:bg-[#17483f] sm:col-span-2"
          type="submit"
        >
          <Upload aria-hidden className="h-4 w-4" />
          Submit locked baseline
        </button>
      </form>
    </Panel>
  );
}

function DailyForm({
  alreadyCheckedIn,
  defaultWeight,
  onSubmit,
  programDay,
}: {
  alreadyCheckedIn: boolean;
  defaultWeight?: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  programDay: number;
}) {
  return (
    <Panel icon={Dumbbell} title={`Daily Check-In: Day ${programDay}`}>
      {alreadyCheckedIn ? (
        <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-[#8aa49c] bg-[#eef5f2] p-5 text-center">
          <BadgeCheck aria-hidden className="h-8 w-8 text-[#2f6f63]" />
          <p className="mt-3 font-bold">Today&apos;s check-in is locked.</p>
          <p className="mt-1 text-sm text-[#5f5f5f]">Daily records cannot be edited after submission.</p>
        </div>
      ) : (
        <form className="grid gap-3 sm:grid-cols-2 sm:gap-4" onSubmit={onSubmit}>
          <Field
            defaultValue={defaultWeight?.toString()}
            label="Today's weight"
            min="50"
            name="weightLbs"
            required
            step="0.1"
            suffix="lb"
          />
          <div className="flex flex-col justify-end gap-3">
            <CheckBox label="Workout completed" name="workoutCompleted" />
            <CheckBox label="Nutrition goals hit" name="nutritionGoalsHit" />
          </div>
          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1f5d52] px-4 text-sm font-bold text-white transition hover:bg-[#17483f] sm:col-span-2"
            type="submit"
          >
            <CalendarCheck aria-hidden className="h-4 w-4" />
            Submit daily check-in
          </button>
        </form>
      )}
    </Panel>
  );
}

function MonthlyForm({
  month,
  onSubmit,
  state,
}: {
  month: 1 | 2 | 3;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  state: ProgressState;
}) {
  const body = bodyCompositionSummary(state);
  return (
    <Panel icon={Activity} title={`Month ${month} Full Update`}>
      <form className="grid gap-3 sm:grid-cols-2 sm:gap-4" onSubmit={onSubmit}>
        <Field defaultValue={body.currentWeight?.toString()} label="Weight" min="50" name="weightLbs" required step="0.1" suffix="lb" />
        <Field defaultValue={body.currentWaist?.toString()} label="Waist circumference" min="15" name="waistInches" required step="0.1" suffix="in" />
        <Field defaultValue={body.currentBodyFat?.toString()} label="Body fat" max="70" min="3" name="bodyFatPercent" required step="0.1" suffix="%" />
        <MethodSelect />
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1f5d52] px-4 text-sm font-bold text-white transition hover:bg-[#17483f] sm:col-span-2"
          type="submit"
        >
          <FileCheck aria-hidden className="h-4 w-4" />
          Submit full update
        </button>
      </form>
    </Panel>
  );
}

function GraduationForm({
  onSubmit,
  state,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  state: ProgressState;
}) {
  const body = bodyCompositionSummary(state);
  return (
    <Panel icon={Goal} title="Graduation Metrics">
      <form className="grid gap-3 sm:grid-cols-2 sm:gap-4" onSubmit={onSubmit}>
        <Field defaultValue={body.currentWeight?.toString()} label="Final weight" min="50" name="weightLbs" required step="0.1" suffix="lb" />
        <Field defaultValue={body.currentWaist?.toString()} label="Final waist" min="15" name="waistInches" required step="0.1" suffix="in" />
        <Field defaultValue={body.currentBodyFat?.toString()} label="Final body fat" max="70" min="3" name="bodyFatPercent" required step="0.1" suffix="%" />
        <MethodSelect />
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1f5d52] px-4 text-sm font-bold text-white transition hover:bg-[#17483f] sm:col-span-2"
          type="submit"
        >
          <ShieldCheck aria-hidden className="h-4 w-4" />
          Submit graduation review
        </button>
      </form>
    </Panel>
  );
}

function StatusStrip({ state }: { state: ProgressState }) {
  const compliance = complianceSummary(state);
  const body = bodyCompositionSummary(state);
  const deadline = fullCheckInDeadline(state.baseline);
  const gradDate = graduationDate(state.baseline);
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <InfoBlock
        label="Baseline lock"
        value={isBaselineOnTime(state.baseline) ? "On time" : "Late review"}
        detail={deadline ? `Due by ${deadline}` : ""}
      />
      <InfoBlock
        label="Guarantee target"
        value={`${Math.max((state.baseline?.bodyFatPercent ?? 0) - 5, 0).toFixed(1)}% BF or lower`}
        detail="Five percentage points in 90 days"
      />
      <InfoBlock
        label="Graduation"
        value={gradDate ?? "Pending"}
        detail={`${compliance.missedWeighIns} missed weigh-ins, ${body.waistLoss} in waist loss`}
      />
    </section>
  );
}

function InfoBlock({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="min-h-28 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6d6d6d]">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-[#606060]">{detail}</p>
    </div>
  );
}

function GuaranteePanel({ state }: { state: ProgressState }) {
  const compliance = complianceSummary(state);
  const body = bodyCompositionSummary(state);
  const guarantee = guaranteeSummary(state);

  return (
    <Panel icon={ShieldCheck} title="Guarantee Review">
      <div className="space-y-3">
        <ReviewRow done={guarantee.metBodyFat} label="5 percentage-point body-fat loss" value={`${body.bodyFatPointLoss}%`} />
        <ReviewRow done={guarantee.metCompliance} label="85% compliance" value={`${compliance.complianceRate}%`} />
        <ReviewRow done={guarantee.graduated} label="Graduation metrics submitted" value={guarantee.graduated ? "Yes" : "No"} />
      </div>
      <div className="mt-5 rounded-lg bg-[#f5f1e7] p-4">
        <p className="text-sm font-bold">{guarantee.status}</p>
        <p className="mt-1 text-sm leading-6 text-[#5f5f5f]">
          Compliance counts a day only when the weigh-in is submitted and the scheduled workout is
          marked complete.
        </p>
      </div>
    </Panel>
  );
}

function TimelinePanel({ state }: { state: ProgressState }) {
  return (
    <Panel icon={CalendarCheck} title="Program Timeline">
      <div className="space-y-3 text-sm">
        <TimelineRow label="Baseline" value={state.baseline ? state.baseline.submittedAt.slice(0, 10) : "Not submitted"} />
        <TimelineRow label="Month 1 update" value={state.monthlyUpdates.find((item) => item.month === 1)?.submittedAt.slice(0, 10) ?? "Pending"} />
        <TimelineRow label="Month 2 update" value={state.monthlyUpdates.find((item) => item.month === 2)?.submittedAt.slice(0, 10) ?? "Pending"} />
        <TimelineRow label="Month 3 update" value={state.monthlyUpdates.find((item) => item.month === 3)?.submittedAt.slice(0, 10) ?? "Pending"} />
        <TimelineRow label="Graduation" value={state.graduation?.submittedAt.slice(0, 10) ?? "Pending"} />
      </div>
    </Panel>
  );
}

function EvidencePanel() {
  return (
    <Panel icon={Lock} title="Evidence Rules">
      <ul className="space-y-2 text-sm leading-6 text-[#5f5f5f]">
        <li>No BMI chart or BMI category is used.</li>
        <li>Body fat percentage is required at start and graduation.</li>
        <li>Accepted methods: bioimpedance, Bod Pod, skin calipers.</li>
        <li>Progress photos can be added in the production file-upload step.</li>
      </ul>
    </Panel>
  );
}

function AdminPanel({
  members,
  onSelectMember,
  selectedMember,
}: {
  members: MemberRecord[];
  onSelectMember: (memberId: string) => void;
  selectedMember?: MemberRecord;
}) {
  const state = selectedMember?.state ?? emptyProgressState();
  const compliance = complianceSummary(state);
  const body = bodyCompositionSummary(state);
  const guarantee = guaranteeSummary(state);

  return (
    <Panel icon={Gauge} title="Admin Command View">
      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#8aa49c] bg-[#eef5f2] p-5 text-sm leading-6 text-[#4f5f59]">
          No members have submitted a baseline yet. Once a member completes the start assessment,
          they will appear here by name with compliance and guarantee status.
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 md:hidden">
            {members.map((member) => {
              const memberCompliance = complianceSummary(member.state);
              const memberBody = bodyCompositionSummary(member.state);
              const memberGuarantee = guaranteeSummary(member.state);
              const selected = member.id === selectedMember?.id;

              return (
                <button
                  className="w-full rounded-lg border border-black/10 bg-white p-4 text-left shadow-sm transition hover:bg-[#f5f1e7] disabled:bg-[#eef5f2]"
                  disabled={selected}
                  key={member.id}
                  onClick={() => onSelectMember(member.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-bold">{member.displayName}</p>
                      <p className="mt-1 break-all text-xs text-[#707070]">{member.userId}</p>
                    </div>
                    <span className="shrink-0 rounded-md border border-black/10 px-2 py-1 text-xs font-bold">
                      {selected ? "Selected" : "Open"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <MiniStat label="Compliance" value={`${memberCompliance.complianceRate}%`} />
                    <MiniStat label="BF lost" value={`${memberBody.bodyFatPointLoss}%`} />
                    <MiniStat label="Status" value={memberGuarantee.status} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mb-5 hidden overflow-x-auto rounded-lg border border-black/10 md:block">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#f5f1e7] text-xs uppercase tracking-[0.08em] text-[#606060]">
              <tr>
                <th className="px-3 py-3">Member</th>
                <th className="px-3 py-3">Compliance</th>
                <th className="px-3 py-3">BF lost</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Review</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberCompliance = complianceSummary(member.state);
                const memberBody = bodyCompositionSummary(member.state);
                const memberGuarantee = guaranteeSummary(member.state);
                const selected = member.id === selectedMember?.id;

                return (
                  <tr className="border-t border-black/10" key={member.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{member.displayName}</p>
                      <p className="mt-1 text-xs text-[#707070]">{member.userId}</p>
                    </td>
                    <td className="px-3 py-3 text-[#5f5f5f]">
                      {memberCompliance.complianceRate}%
                    </td>
                    <td className="px-3 py-3 text-[#5f5f5f]">
                      {memberBody.bodyFatPointLoss}%
                    </td>
                    <td className="px-3 py-3 text-[#5f5f5f]">{memberGuarantee.status}</td>
                    <td className="px-3 py-3">
                      <button
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-black/15 px-3 text-sm font-bold transition hover:bg-[#f5f1e7] disabled:bg-[#eef5f2]"
                        disabled={selected}
                        onClick={() => onSelectMember(member.id)}
                        type="button"
                      >
                        <FileCheck aria-hidden className="h-4 w-4" />
                        {selected ? "Selected" : "Open"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}

      {selectedMember ? (
        <div className="mb-5 rounded-lg bg-[#f5f1e7] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#606060]">
            Reviewing
          </p>
          <p className="mt-1 text-2xl font-bold">{selectedMember.displayName}</p>
          <p className="mt-1 text-sm text-[#5f5f5f]">
            Last updated {selectedMember.updatedAt.slice(0, 10)}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoBlock detail="Required: 85%" label="Compliance" value={`${compliance.complianceRate}%`} />
        <InfoBlock detail="Required: 5.0%" label="Body fat loss" value={`${body.bodyFatPointLoss}%`} />
        <InfoBlock detail="Daily failures" label="Missed workouts" value={String(compliance.missedWorkouts)} />
        <InfoBlock detail="Daily failures" label="Missed weigh-ins" value={String(compliance.missedWeighIns)} />
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-black/10">
        <table className="min-w-[560px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#f5f1e7] text-xs uppercase tracking-[0.08em] text-[#606060]">
            <tr>
              <th className="px-3 py-3">Evidence</th>
              <th className="px-3 py-3">Current</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <AdminRow label="Whop member" value={selectedMember?.displayName ?? "None selected"} good={Boolean(selectedMember)} />
            <AdminRow label="Whop user ID" value={selectedMember?.userId ?? "None selected"} good={Boolean(selectedMember)} />
            <AdminRow label="Baseline within 48 hours" value={state.baseline ? state.baseline.submittedAt.slice(0, 10) : "Missing"} good={isBaselineOnTime(state.baseline)} />
            <AdminRow label="Daily check-ins" value={`${state.dailyCheckIns.length}/${compliance.dueDays}`} good={compliance.missedWeighIns === 0} />
            <AdminRow label="Workout completion" value={`${compliance.dueDays - compliance.missedWorkouts}/${compliance.dueDays}`} good={compliance.missedWorkouts === 0} />
            <AdminRow label="Guarantee decision" value={guarantee.status} good={guarantee.eligible} />
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#f5f1e7] p-2">
      <p className="text-[11px] font-semibold uppercase text-[#707070]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold">{value}</p>
    </div>
  );
}

function AdminRow({ good, label, value }: { good: boolean; label: string; value: string }) {
  return (
    <tr className="border-t border-black/10">
      <td className="px-3 py-3 font-semibold">{label}</td>
      <td className="px-3 py-3 text-[#5f5f5f]">{value}</td>
      <td className="px-3 py-3">{good ? "Clear" : "Review"}</td>
    </tr>
  );
}

function ReviewRow({ done, label, value }: { done: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3">
      <div className="flex items-center gap-2">
        {done ? (
          <BadgeCheck aria-hidden className="h-4 w-4 text-[#2f6f63]" />
        ) : (
          <Goal aria-hidden className="h-4 w-4 text-[#9a5b22]" />
        )}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <span className="text-sm text-[#5f5f5f]">{value}</span>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-2 last:border-0 last:pb-0">
      <span className="font-semibold">{label}</span>
      <span className="text-[#606060]">{value}</span>
    </div>
  );
}

function CheckBox({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-md border border-black/10 px-3 text-sm font-semibold">
      <input className="h-4 w-4 accent-[#1f5d52]" name={name} type="checkbox" />
      {label}
    </label>
  );
}

function MethodSelect() {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#2b2b2b]">
      Body fat method
      <select
        className="h-12 rounded-md border border-black/15 bg-white px-3 text-base font-normal outline-none ring-[#8aa49c] focus:ring-2"
        name="bodyFatMethod"
        required
      >
        {bodyFatMethods.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  defaultValue,
  label,
  name,
  suffix,
  type = "number",
  ...props
}: {
  defaultValue?: string;
  label: string;
  name: string;
  suffix?: string;
  type?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#2b2b2b]">
      <span>{label}</span>
      <div className="flex h-12 overflow-hidden rounded-md border border-black/15 bg-white focus-within:ring-2 focus-within:ring-[#8aa49c]">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 text-base font-normal outline-none"
          defaultValue={defaultValue}
          name={name}
          type={type}
          {...props}
        />
        {suffix ? (
          <span className="flex items-center border-l border-black/10 bg-[#f6f5ef] px-3 text-sm text-[#606060]">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

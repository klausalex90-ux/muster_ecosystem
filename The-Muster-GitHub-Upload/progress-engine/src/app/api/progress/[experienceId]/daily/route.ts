import { NextResponse } from "next/server";
import { DailyCheckIn, addDays, clampProgramDay } from "@/lib/progress";
import { getMemberRecord, updateMemberState } from "@/lib/server-progress";
import { requireExperienceViewerFromHeaders } from "@/lib/whop-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ experienceId: string }> },
) {
  try {
    const { experienceId } = await params;
    const viewer = await requireExperienceViewerFromHeaders(experienceId, request.headers);
    const existing = getMemberRecord({
      companyId: viewer.companyId!,
      userId: viewer.userId,
    });

    if (!existing?.state.baseline) {
      return NextResponse.json({ error: "Baseline required first." }, { status: 400 });
    }

    const day = clampProgramDay(existing.state.baseline);
    if (existing.state.dailyCheckIns.some((checkIn) => checkIn.day === day)) {
      return NextResponse.json({ error: "Daily check-in is already locked." }, { status: 409 });
    }

    const body = (await request.json()) as {
      nutritionGoalsHit: boolean;
      weightLbs: number;
      workoutCompleted: boolean;
    };
    const dueDate = addDays(existing.state.baseline.submittedAt.slice(0, 10), day - 1);
    const checkIn: DailyCheckIn = {
      day,
      dueDate,
      nutritionGoalsHit: Boolean(body.nutritionGoalsHit),
      submittedAt: new Date().toISOString(),
      weightLbs: Number(body.weightLbs),
      workoutCompleted: Boolean(body.workoutCompleted),
    };

    const member = updateMemberState({
      companyId: viewer.companyId!,
      displayName: viewer.displayName,
      experienceId,
      update: (current) => ({
        ...current,
        dailyCheckIns: [...current.dailyCheckIns, checkIn],
      }),
      userId: viewer.userId,
    });

    return NextResponse.json({ member });
  } catch {
    return NextResponse.json(
      { error: "Whop membership access required." },
      { status: 401 },
    );
  }
}


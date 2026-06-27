import { NextResponse } from "next/server";
import { BodyFatMethod, MonthlyUpdate, currentMonthlyDue, monthlyDueDate } from "@/lib/progress";
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

    const month = currentMonthlyDue(existing.state.baseline, existing.state.monthlyUpdates);
    if (!month) {
      return NextResponse.json({ error: "No monthly update is due." }, { status: 409 });
    }

    const body = (await request.json()) as MonthlyUpdate;
    const update: MonthlyUpdate = {
      bodyFatMethod: body.bodyFatMethod as BodyFatMethod,
      bodyFatPercent: Number(body.bodyFatPercent),
      dueDate: monthlyDueDate(existing.state.baseline, month),
      month,
      submittedAt: new Date().toISOString(),
      waistInches: Number(body.waistInches),
      weightLbs: Number(body.weightLbs),
    };

    const member = updateMemberState({
      companyId: viewer.companyId!,
      displayName: viewer.displayName,
      experienceId,
      update: (current) => ({
        ...current,
        monthlyUpdates: [...current.monthlyUpdates, update],
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


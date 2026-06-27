import { NextResponse } from "next/server";
import { BaselineMetrics } from "@/lib/progress";
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

    if (existing?.state.baseline) {
      return NextResponse.json({ error: "Baseline is already locked." }, { status: 409 });
    }

    const body = (await request.json()) as BaselineMetrics;
    const baseline: BaselineMetrics = {
      bodyFatMethod: body.bodyFatMethod,
      bodyFatPercent: Number(body.bodyFatPercent),
      heightInches: Number(body.heightInches),
      purchaseDate: body.purchaseDate,
      submittedAt: new Date().toISOString(),
      waistInches: Number(body.waistInches),
      weightLbs: Number(body.weightLbs),
    };

    const member = updateMemberState({
      companyId: viewer.companyId!,
      displayName: viewer.displayName,
      experienceId,
      update: (current) => ({ ...current, baseline }),
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


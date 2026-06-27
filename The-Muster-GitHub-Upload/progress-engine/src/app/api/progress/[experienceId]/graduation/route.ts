import { NextResponse } from "next/server";
import { BodyFatMethod, GraduationMetrics } from "@/lib/progress";
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

    if (existing.state.graduation) {
      return NextResponse.json({ error: "Graduation metrics are already locked." }, { status: 409 });
    }

    const body = (await request.json()) as GraduationMetrics;
    const graduation: GraduationMetrics = {
      bodyFatMethod: body.bodyFatMethod as BodyFatMethod,
      bodyFatPercent: Number(body.bodyFatPercent),
      submittedAt: new Date().toISOString(),
      waistInches: Number(body.waistInches),
      weightLbs: Number(body.weightLbs),
    };

    const member = updateMemberState({
      companyId: viewer.companyId!,
      displayName: viewer.displayName,
      experienceId,
      update: (current) => ({ ...current, graduation }),
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


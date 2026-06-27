import { NextResponse } from "next/server";
import { ensureMemberRecord } from "@/lib/server-progress";
import { requireExperienceViewerFromHeaders } from "@/lib/whop-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ experienceId: string }> },
) {
  try {
    const { experienceId } = await params;
    const viewer = await requireExperienceViewerFromHeaders(experienceId, request.headers);
    const member = ensureMemberRecord({
      companyId: viewer.companyId!,
      displayName: viewer.displayName,
      experienceId,
      userId: viewer.userId,
    });

    return NextResponse.json({ member, viewer });
  } catch {
    return NextResponse.json(
      { error: "Whop membership access required." },
      { status: 401 },
    );
  }
}


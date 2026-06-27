import { NextResponse } from "next/server";
import { getCompanyMembers } from "@/lib/server-progress";
import { requireCompanyAdminFromHeaders } from "@/lib/whop-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;
    await requireCompanyAdminFromHeaders(companyId, request.headers);

    return NextResponse.json({ members: getCompanyMembers(companyId) });
  } catch {
    return NextResponse.json({ error: "Whop admin access required." }, { status: 401 });
  }
}


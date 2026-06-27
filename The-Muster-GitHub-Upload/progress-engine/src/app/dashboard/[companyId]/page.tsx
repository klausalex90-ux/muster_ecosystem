import { MusterSuite } from "@/components/MusterSuite";
import { WhopAccessRequired } from "@/components/WhopAccessRequired";
import { requireCompanyAdmin } from "@/lib/whop-auth";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  try {
    await requireCompanyAdmin(companyId);
  } catch {
    return <WhopAccessRequired label="admin" />;
  }

  return <MusterSuite id={companyId} mode="admin" />;
}

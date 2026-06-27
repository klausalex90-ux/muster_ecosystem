import { MusterSuite } from "@/components/MusterSuite";
import { WhopAccessRequired } from "@/components/WhopAccessRequired";
import { requireExperienceViewer } from "@/lib/whop-auth";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  try {
    await requireExperienceViewer(experienceId);
  } catch {
    return <WhopAccessRequired label="member" />;
  }

  return <MusterSuite id={experienceId} mode="member" />;
}

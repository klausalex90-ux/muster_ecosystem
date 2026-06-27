import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export type WhopViewer = {
  accessLevel: "admin" | "customer" | "no_access";
  companyId?: string;
  displayName: string;
  experienceId?: string;
  userId: string;
};

export async function getVerifiedUserId(headerBag: Headers) {
  const payload = await whopsdk.verifyUserToken(headerBag);
  return payload.userId;
}

export async function getDisplayName(userId: string, companyId?: string) {
  try {
    const user = await whopsdk.users.retrieve(
      userId,
      companyId ? { company_id: companyId } : undefined,
    );
    return user.name ?? user.username ?? user.id;
  } catch {
    return userId;
  }
}

export async function getExperienceCompanyId(experienceId: string) {
  const experience = await whopsdk.experiences.retrieve(experienceId);
  return experience.company.id;
}

export async function requireExperienceViewer(experienceId: string): Promise<WhopViewer> {
  const headerBag = await headers();
  return requireExperienceViewerFromHeaders(experienceId, headerBag);
}

export async function requireExperienceViewerFromHeaders(
  experienceId: string,
  headerBag: Headers,
): Promise<WhopViewer> {
  const userId = await getVerifiedUserId(headerBag);
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (!access.has_access) {
    throw new Error("NO_EXPERIENCE_ACCESS");
  }

  const companyId = await getExperienceCompanyId(experienceId);
  const displayName = await getDisplayName(userId, companyId);

  return {
    accessLevel: access.access_level,
    companyId,
    displayName,
    experienceId,
    userId,
  };
}

export async function requireCompanyAdmin(companyId: string): Promise<WhopViewer> {
  const headerBag = await headers();
  return requireCompanyAdminFromHeaders(companyId, headerBag);
}

export async function requireCompanyAdminFromHeaders(
  companyId: string,
  headerBag: Headers,
): Promise<WhopViewer> {
  const userId = await getVerifiedUserId(headerBag);
  const access = await whopsdk.users.checkAccess(companyId, { id: userId });

  if (access.access_level !== "admin") {
    throw new Error("NO_ADMIN_ACCESS");
  }

  const displayName = await getDisplayName(userId, companyId);

  return {
    accessLevel: access.access_level,
    companyId,
    displayName,
    userId,
  };
}

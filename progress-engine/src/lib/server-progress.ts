import { MemberRecord, ProgressState, emptyProgressState } from "@/lib/progress";

type ProgressStore = {
  members: MemberRecord[];
};

type ServerProgressGlobal = typeof globalThis & {
  __progressEngineStore?: ProgressStore;
};

function getStore() {
  const globalStore = globalThis as ServerProgressGlobal;
  globalStore.__progressEngineStore ??= { members: [] };
  return globalStore.__progressEngineStore;
}

export function getCompanyMembers(companyId: string) {
  return getStore().members.filter((member) => member.companyId === companyId);
}

export function getMemberRecord({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  return getStore().members.find(
    (member) => member.companyId === companyId && member.userId === userId,
  );
}

export function ensureMemberRecord({
  companyId,
  displayName,
  experienceId,
  userId,
}: {
  companyId: string;
  displayName: string;
  experienceId: string;
  userId: string;
}) {
  const store = getStore();
  const existing = getMemberRecord({ companyId, userId });
  const now = new Date().toISOString();

  if (existing) {
    existing.displayName = displayName;
    existing.experienceId = experienceId;
    existing.updatedAt = now;
    return existing;
  }

  const member: MemberRecord = {
    id: `${companyId}:${userId}`,
    companyId,
    createdAt: now,
    displayName,
    experienceId,
    state: emptyProgressState(),
    updatedAt: now,
    userId,
  };

  store.members.push(member);
  return member;
}

export function updateMemberState({
  companyId,
  displayName,
  experienceId,
  update,
  userId,
}: {
  companyId: string;
  displayName: string;
  experienceId: string;
  update: (current: ProgressState) => ProgressState;
  userId: string;
}) {
  const member = ensureMemberRecord({ companyId, displayName, experienceId, userId });
  member.state = update(member.state);
  member.updatedAt = new Date().toISOString();
  return member;
}


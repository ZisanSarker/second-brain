export const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 100,
  ADMIN: 80,
  EDITOR: 60,
  MEMBER: 40,
  VIEWER: 20,
};

export function hasMinimumRole(userRole: string, minimumRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const minLevel = ROLE_HIERARCHY[minimumRole] ?? 0;
  return userLevel >= minLevel;
}

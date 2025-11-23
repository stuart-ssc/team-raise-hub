export enum PermissionLevel {
  ORGANIZATION_ADMIN = 'organization_admin',
  PROGRAM_MANAGER = 'program_manager',
  PARTICIPANT = 'participant',
  SUPPORTER = 'supporter',
  SPONSOR = 'sponsor'
}

export const userTypePermissionMap: Record<string, PermissionLevel> = {
  // School roles
  'Principal': PermissionLevel.ORGANIZATION_ADMIN,
  'Athletic Director': PermissionLevel.ORGANIZATION_ADMIN,
  'Coach': PermissionLevel.PROGRAM_MANAGER,
  'Club Sponsor': PermissionLevel.PROGRAM_MANAGER,
  'Booster Leader': PermissionLevel.PROGRAM_MANAGER,
  'Team Player': PermissionLevel.PARTICIPANT,
  'Club Participant': PermissionLevel.PARTICIPANT,
  'Family Member': PermissionLevel.SUPPORTER,
  'Sponsor': PermissionLevel.SPONSOR,
  
  // Non-profit roles
  'Executive Director': PermissionLevel.ORGANIZATION_ADMIN,
  'Program Director': PermissionLevel.PROGRAM_MANAGER,
  'Volunteer': PermissionLevel.PARTICIPANT,
  'Board Member': PermissionLevel.SUPPORTER,
  'Donor': PermissionLevel.SPONSOR
};

export function getPermissionLevel(userTypeName: string): PermissionLevel {
  return userTypePermissionMap[userTypeName] || PermissionLevel.SUPPORTER;
}

export function hasPermission(
  userTypeName: string, 
  requiredLevel: PermissionLevel
): boolean {
  const userLevel = getPermissionLevel(userTypeName);
  const levels = Object.values(PermissionLevel);
  return levels.indexOf(userLevel) <= levels.indexOf(requiredLevel);
}

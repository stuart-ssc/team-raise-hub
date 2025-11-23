import { getPermissionLevel, PermissionLevel } from "./permissions";

export type OrganizationType = 'school' | 'nonprofit';

interface TerminologyMap {
  organization: string;
  organizationAdmin: string;
  programManager: string;
  program: string;
  programs: string;
  participant: string;
  supporter: string;
}

export const terminology: Record<OrganizationType, TerminologyMap> = {
  school: {
    organization: 'School',
    organizationAdmin: 'Principal / Athletic Director',
    programManager: 'Coach / Club Sponsor',
    program: 'Team / Club',
    programs: 'Teams / Clubs',
    participant: 'Student / Player',
    supporter: 'Family Member'
  },
  nonprofit: {
    organization: 'Non-Profit',
    organizationAdmin: 'Executive Director',
    programManager: 'Program Director',
    program: 'Program',
    programs: 'Programs',
    participant: 'Volunteer / Member',
    supporter: 'Board Member / Donor'
  }
};

export function getLabel(
  orgType: OrganizationType, 
  key: keyof TerminologyMap
): string {
  return terminology[orgType][key];
}

export function getUserTypeLabel(
  userTypeName: string, 
  orgType: OrganizationType
): string {
  const permissionLevel = getPermissionLevel(userTypeName);
  
  const labelMap: Record<PermissionLevel, keyof TerminologyMap> = {
    [PermissionLevel.ORGANIZATION_ADMIN]: 'organizationAdmin',
    [PermissionLevel.PROGRAM_MANAGER]: 'programManager',
    [PermissionLevel.PARTICIPANT]: 'participant',
    [PermissionLevel.SUPPORTER]: 'supporter',
    [PermissionLevel.SPONSOR]: 'supporter'
  };
  
  return getLabel(orgType, labelMap[permissionLevel]);
}

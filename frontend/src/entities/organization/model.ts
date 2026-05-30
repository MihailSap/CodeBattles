export const ORGANIZATION_MEMBER_ROLE = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;
export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLE)[keyof typeof ORGANIZATION_MEMBER_ROLE];
export const ORGANIZATION_MEMBER_ROLE_LABELS = {
  [ORGANIZATION_MEMBER_ROLE.OWNER]: 'Владелец',
  [ORGANIZATION_MEMBER_ROLE.MEMBER]: 'Участник',
} as const satisfies Record<OrganizationMemberRole, string>;

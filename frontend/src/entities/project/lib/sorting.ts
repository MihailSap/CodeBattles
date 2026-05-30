import { PROJECT_MEMBER_ROLE, TASK_STATUS, type TaskStatus } from '../model';
import type { Project, ProjectParticipant, Task } from '../model/types';

interface SortableOrganization {
  name: string;
  role?: string;
}

interface JoinRequest {
  login: string;
  fullName?: string;
}

export const sortOrganizations = <T extends SortableOrganization>(organizations: readonly T[]): T[] => {
  return [...organizations].sort((a, b) => {
    const roleA = a.role === 'OWNER' ? 0 : 1;
    const roleB = b.role === 'OWNER' ? 0 : 1;
    if (roleA !== roleB) return roleA - roleB;

    return (a.name || '').localeCompare(b.name || '');
  });
};

export const sortOrganizationsByName = <T extends Pick<SortableOrganization, 'name'>>(
  organizations: readonly T[]
): T[] => {
  return [...organizations].sort((a, b) => a.name.localeCompare(b.name));
};

export const sortProjects = <T extends Project>(projects: readonly T[]): T[] => {
  const roleWeights: Partial<Record<NonNullable<Project['role']>, number>> = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2,
  };

  return [...projects].sort((a, b) => {
    const weightA = a.role ? (roleWeights[a.role] ?? 3) : 3;
    const weightB = b.role ? (roleWeights[b.role] ?? 3) : 3;
    if (weightA !== weightB) return weightA - weightB;

    return (a.name || '').localeCompare(b.name || '');
  });
};

export const sortProjectsByName = <T extends Pick<Project, 'name'>>(projects: readonly T[]): T[] => {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
};

export const sortParticipants = <T extends ProjectParticipant>(participants: readonly T[]): T[] => {
  const roleWeights: Record<ProjectParticipant['role'], number> = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2,
  };

  return [...participants].sort((a, b) => {
    const weightA = roleWeights[a.role] ?? 3;
    const weightB = roleWeights[b.role] ?? 3;
    if (weightA !== weightB) return weightA - weightB;
    const nameCompare = (a.fullName || '').localeCompare(b.fullName || '');
    if (nameCompare !== 0) return nameCompare;

    return (a.login || '').localeCompare(b.login || '');
  });
};

export const sortJoinRequests = <T extends JoinRequest>(requests: readonly T[]): T[] => {
  return [...requests].sort((a, b) => (a.fullName || a.login || '').localeCompare(b.fullName || b.login || ''));
};

export const sortTasks = <T extends Task>(tasks: readonly T[]): T[] => {
  const statusWeights: Record<TaskStatus, number> = {
    [TASK_STATUS.IN_PROGRESS]: 0,
    [TASK_STATUS.REWORK]: 1,
    [TASK_STATUS.IN_REVIEW]: 2,
    [TASK_STATUS.DONE]: 3,
  };

  return [...tasks].sort((a, b) => {
    const weightA = statusWeights[a.status];
    const weightB = statusWeights[b.status];
    if (weightA !== weightB) return weightA - weightB;

    return (a.name || '').localeCompare(b.name || '');
  });
};

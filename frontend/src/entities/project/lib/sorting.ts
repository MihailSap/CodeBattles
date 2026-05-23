import { PROJECT_MEMBER_ROLE } from '../model';

export const sortOrganizations = (organizations: LegacyValue) => {
  return [...organizations].sort((a: LegacyValue, b: LegacyValue) => {
    const roleA = a.role === 'OWNER' ? 0 : 1;
    const roleB = b.role === 'OWNER' ? 0 : 1;
    if (roleA !== roleB) return roleA - roleB;

    return (a.name || '').localeCompare(b.name || '');
  });
};

export const sortOrganizationsByName = (organizations: LegacyValue) => {
  return [...organizations].sort((a: LegacyValue, b: LegacyValue) => (a.name || '').localeCompare(b.name || ''));
};

export const sortProjects = (projects: LegacyValue) => {
  const roleWeights = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2,
  };

  return [...projects].sort((a: LegacyValue, b: LegacyValue) => {
    const weightA = roleWeights[a.role] ?? 3;
    const weightB = roleWeights[b.role] ?? 3;
    if (weightA !== weightB) return weightA - weightB;

    return (a.name || '').localeCompare(b.name || '');
  });
};

export const sortProjectsByName = (projects: LegacyValue) => {
  return [...projects].sort((a: LegacyValue, b: LegacyValue) => (a.name || '').localeCompare(b.name || ''));
};

export const sortParticipants = (participants: LegacyValue) => {
  const roleWeights = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2,
  };

  return [...participants].sort((a: LegacyValue, b: LegacyValue) => {
    const weightA = roleWeights[a.role] ?? 3;
    const weightB = roleWeights[b.role] ?? 3;
    if (weightA !== weightB) return weightA - weightB;
    const nameCompare = (a.fullName || '').localeCompare(b.fullName || '');
    if (nameCompare !== 0) return nameCompare;

    return (a.login || '').localeCompare(b.login || '');
  });
};

export const sortJoinRequests = (requests: LegacyValue) => {
  return [...requests].sort((a: LegacyValue, b: LegacyValue) =>
    (a.fullName || a.login || '').localeCompare(b.fullName || b.login || '')
  );
};

export const sortTasks = (tasks: LegacyValue) => {
  const statusWeights = {
    IN_PROGRESS: 0,
    REWORK: 1,
    IN_REVIEW: 2,
    DONE: 3,
  };

  return [...tasks].sort((a: LegacyValue, b: LegacyValue) => {
    const weightA = (statusWeights as LegacyValue)[a.status] ?? 4;
    const weightB = (statusWeights as LegacyValue)[b.status] ?? 4;
    if (weightA !== weightB) return weightA - weightB;

    return (a.name || '').localeCompare(b.name || '');
  });
};

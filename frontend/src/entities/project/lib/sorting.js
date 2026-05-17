import { PROJECT_MEMBER_ROLE } from '../model';

export const sortOrganizations = (organizations) => {
  return [...organizations].sort((a, b) => {
    const roleA = a.role === 'OWNER' ? 0 : 1;
    const roleB = b.role === 'OWNER' ? 0 : 1;
    
    if (roleA !== roleB) return roleA - roleB;
    return (a.name || '').localeCompare(b.name || '');
  });
};

export const sortOrganizationsByName = (organizations) => {
  return [...organizations].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const sortProjects = (projects) => {
  const roleWeights = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2
  };

  return [...projects].sort((a, b) => {
    const weightA = roleWeights[a.role] ?? 3;
    const weightB = roleWeights[b.role] ?? 3;

    if (weightA !== weightB) return weightA - weightB;
    return (a.name || '').localeCompare(b.name || '');
  });
};

export const sortProjectsByName = (projects) => {
  return [...projects].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const sortParticipants = (participants) => {
  const roleWeights = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2
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

export const sortJoinRequests = (requests) => {
  return [...requests].sort((a, b) => (a.fullName || a.login || '').localeCompare(b.fullName || b.login || ''));
};

export const sortTasks = (tasks) => {
  const statusWeights = {
    'IN_PROGRESS': 0,
    'REWORK': 1,
    'IN_REVIEW': 2,
    'DONE': 3
  };

  return [...tasks].sort((a, b) => {
    const weightA = statusWeights[a.status] ?? 4;
    const weightB = statusWeights[b.status] ?? 4;

    if (weightA !== weightB) return weightA - weightB;
    return (a.name || '').localeCompare(b.name || '');
  });
};

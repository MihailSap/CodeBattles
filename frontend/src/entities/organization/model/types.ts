import type { Project } from '@/entities/project/model/types';

export interface Organization {
  id: number | string;
  name: string;
  logo?: string;
  link?: string;
  description?: string;
  role?: string;
  participantsCount?: number;
  projectsCount?: number;
  projects?: Project[];
  hiddenProjectsCount?: number;
  hasPendingRequest?: boolean;
}

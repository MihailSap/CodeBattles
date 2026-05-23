import type { Project } from '@/entities/project/model/types';
import type { Organization } from '@/entities/organization/model/types';

export interface FinalReview {
  id: number | string;
  reviewerId: number | string;
  reviewerName: string;
  architecture: number;
  readability: number;
  testability: number;
  scalability: number;
  comment: string;
  verdict: string;
  revealName?: boolean;
}

export interface ReviewHistory {
  id: number | string;
  taskId: number | string;
  status: string;
  uploadedAt: string;
  files: unknown[];
  comments: unknown[];
  finalReviews: FinalReview[];
  isHistory?: boolean;
}

export interface AIEvaluation {
  qualityScore: number;
  cyclomaticComplexity: string;
  solidViolations: {
    count: number;
    severity: string;
  };
  overallComment: string;
}

export interface AIReviewEvaluation {
  qualityScore: number;
  specificity: number;
  techDepth: number;
  correctness: number;
  nonToxicity: number;
}

export interface ReviewDetail {
  id: number | string;
  taskId: number | string;
  status: string;
  uploadedAt: string;
  deadline: string;
  reviewedAt?: string;
  files: unknown[];
  comments: unknown[];
  finalReviews: FinalReview[];
  history: ReviewHistory[];
  aiEvaluation: AIEvaluation | null;
  aiReviewEvaluation: AIReviewEvaluation | null;
}

export interface AssignedReview {
  id: number | string;
  reviewerId: number | string;
  taskId: number | string;
  taskName: string;
  project: Pick<Project, 'id' | 'name'>;
  organization: Pick<Organization, 'id' | 'name'> | null;
  uploadedAt: string;
  responseDeadline: string;
  status: string;
  commentsCount: number;
  checkedByReviewer: boolean;
  reviewedAt: string | null;
  revealAuthorAfterReview: boolean;
}

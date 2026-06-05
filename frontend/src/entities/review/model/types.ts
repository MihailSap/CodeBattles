import type { Organization } from '@/entities/organization/@x/review';
import type { Project } from '@/entities/project/@x/review';
import type { EntityId } from '@/entities/project/@x/review';
import type { CommentCategory, CommentSeverity, ReviewStatus } from '../model';

export type ReviewAuthorRole = 'Assignee' | 'Reviewer' | 'System' | 'AI' | string;

export interface ReviewFile {
  id: string;
  path: string;
  name: string;
  content?: string;
  originalContent?: string;
  isDiff?: boolean;
  isDirectory: boolean;
  children?: ReviewFile[];
}

export interface ReviewComment {
  id: EntityId;
  parentId: EntityId | null;
  authorId?: EntityId;
  authorName: string;
  authorRole: ReviewAuthorRole;
  reviewerIndex?: number;
  revealName?: boolean;
  text: string;
  category?: CommentCategory | null;
  severity?: CommentSeverity | null;
  file?: string;
  startLine?: number;
  endLine?: number;
  createdAt?: string;
  isClosed?: boolean;
  likedBy?: EntityId[];
  dislikedBy?: EntityId[];
  replies: ReviewComment[];
}

export interface FinalReview {
  id: EntityId;
  reviewerId?: EntityId | null;
  reviewerName: string;
  architecture: number;
  readability: number;
  testability: number;
  scalability: number;
  comment: string;
  verdict: string;
  createdAt?: string;
  revealName?: boolean;
  reviewerIndex?: number;
  revealAuthorReview?: boolean;
}

export interface ReviewHistory {
  id: EntityId;
  taskId: EntityId;
  status: ReviewStatus;
  uploadedAt: string;
  files: ReviewFile[];
  comments: ReviewComment[];
  finalReviews: FinalReview[];
  isHistory?: boolean;
}

export interface AIEvaluation {
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  qualityScore?: number | null;
  cyclomaticComplexity?: string | null;
  solidViolations?: {
    count: number;
    severity: string;
  } | null;
  overallComment?: string | null;
  errorMessage?: string | null;
}

export interface AIReviewEvaluation {
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  qualityScore?: number | null;
  specificity?: number | null;
  techDepth?: number | null;
  correctness?: number | null;
  nonToxicity?: number | null;
  summary?: string | null;
  errorMessage?: string | null;
}

export interface ReviewDetail {
  id: EntityId;
  projectId: EntityId;
  taskId: EntityId;
  taskName?: string | undefined;
  projectName?: string | undefined;
  solutionId?: EntityId;
  reviewType?: string;
  status: ReviewStatus;
  uploadedAt: string;
  deadline: string;
  reviewedAt?: string | undefined;
  files: ReviewFile[];
  comments: ReviewComment[];
  finalReviews: FinalReview[];
  history: ReviewHistory[];
  aiEvaluation: AIEvaluation | null;
  aiReviewEvaluation: AIReviewEvaluation | null;
  revealAuthorAfterReview?: boolean;
}

export interface AssignedReview {
  id: EntityId;
  reviewerId?: EntityId;
  taskId: EntityId;
  taskName: string;
  project: Pick<Project, 'id' | 'name'>;
  organization: Pick<Organization, 'id' | 'name'> | null;
  uploadedAt: string;
  responseDeadline: string;
  status: ReviewStatus;
  commentsCount: number;
  checkedByReviewer: boolean;
  reviewedAt: string | null;
  revealAuthorAfterReview?: boolean;
}

import type { EntityId } from '@/entities/project/@x/review';
import { apiRequest } from '@/shared/api';

import { REVIEW_STATUS, type CommentCategory, type CommentSeverity, type ReportReason } from '../model';
import type {
  AIEvaluation,
  AIReviewEvaluation,
  FinalReview,
  ReviewComment,
  ReviewDetail,
  ReviewFile,
  ReviewHistory,
} from '../model/types';

const AUTHOR_ROLE = {
  ASSIGNEE: 'Assignee',
  REVIEWER: 'Reviewer',
  SYSTEM: 'System',
  AI: 'AI',
} as const;

interface BackendFileDto {
  path: string;
  content?: string;
}

interface BackendFinalReviewDto extends Omit<FinalReview, 'revealName'> {
  revealName?: boolean;
  revealAuthorReview?: boolean;
}

interface BackendCommentDto {
  id: EntityId;
  parentId: EntityId | null;
  authorId?: EntityId;
  authorName?: string;
  authorRole: string;
  reviewerIndex?: number;
  revealName?: boolean;
  text: string;
  file?: string;
  startLine?: number;
  endLine?: number;
  category?: CommentCategory | null;
  severity?: CommentSeverity | null;
  createdAt?: string;
  isClosed?: boolean;
  likedBy?: EntityId[];
  dislikedBy?: EntityId[];
  replies?: BackendCommentDto[];
}

interface BackendHistoryDto {
  id: EntityId;
  taskId?: EntityId;
  status?: ReviewDetail['status'];
  uploadedAt?: string;
  files?: BackendFileDto[];
  comments?: BackendHistoryCommentDto[];
  finalReview?: BackendFinalReviewDto;
}

interface BackendHistoryCommentDto {
  id: EntityId;
  authorId?: EntityId;
  authorName?: string;
  createdAt?: string;
  text: string;
}

interface BackendReviewDto {
  id: EntityId;
  projectId: EntityId;
  taskId: EntityId;
  solutionId?: EntityId;
  reviewType?: string;
  status?: ReviewDetail['status'];
  taskStatus?: string;
  uploadedAt?: string;
  deadline?: string;
  completedAt?: string | null;
  files?: BackendFileDto[];
  comments?: BackendCommentDto[];
  history?: BackendHistoryDto[];
  finalReviews?: BackendFinalReviewDto[];
  aiEvaluation?: AIEvaluation | null;
  aiReviewEvaluation?: AIReviewEvaluation | null;
  revealAuthorAfterReview?: boolean;
  revealAuthorSolution?: boolean;
}

interface MapBackendDetailsOptions {
  useCurrentAssignmentResultOnly?: boolean;
}

export interface FinalReviewPayload {
  architecture: number;
  readability: number;
  testability: number;
  scalability: number;
  comment: string;
  verdict: string;
  overallScore?: number;
  revealName?: boolean;
  reviewerId?: EntityId;
  reviewerName?: string;
}

export interface AddReviewCommentPayload {
  file: string;
  startLine: number;
  endLine: number;
  text: string;
  category?: CommentCategory | null;
  severity?: CommentSeverity | null;
}

export interface ReplyCommentPayload {
  text: string;
  authorId?: EntityId;
  authorName?: string;
  createdAt?: string;
  authorRole?: string;
}

export interface ReportCommentPayload {
  reason: ReportReason;
  message?: string;
  comment?: string;
}

export type CommentThreadAction = 'close' | 'reopen';

const getAuthorRole = (role: string): string => {
  if (role === 'ASSIGNEE') return AUTHOR_ROLE.ASSIGNEE;
  if (role === 'REVIEWER') return AUTHOR_ROLE.REVIEWER;
  if (role === 'SYSTEM') return AUTHOR_ROLE.SYSTEM;
  if (role === 'AI') return AUTHOR_ROLE.AI;

  return role;
};

const mapBackendFile = (file: BackendFileDto): ReviewFile => ({
  id: file.path,
  path: file.path,
  name: file.path.split('/').pop() ?? file.path,
  isDirectory: false,
  ...(file.content !== undefined ? { content: file.content } : {}),
});

const mapBackendFinalReview = (finalReview: BackendFinalReviewDto): FinalReview => ({
  ...finalReview,
  revealName: Boolean(finalReview.revealName ?? finalReview.revealAuthorReview),
});

const mapBackendComment = (
  comment: BackendCommentDto,
  canRevealReviewerNames: boolean,
  revealedReviewerIndexes: Set<number>
): ReviewComment => {
  const authorRole = getAuthorRole(comment.authorRole);
  const isReplyWithUnknownRole = comment.parentId !== null && !authorRole;

  return {
    id: comment.id,
    parentId: comment.parentId,
    authorName: isReplyWithUnknownRole ? 'Участник обсуждения' : (comment.authorName ?? ''),
    authorRole,
    text: comment.text,
    replies: (comment.replies ?? []).map((reply) =>
      mapBackendComment(reply, canRevealReviewerNames, revealedReviewerIndexes)
    ),
    ...(comment.authorId !== undefined ? { authorId: comment.authorId } : {}),
    ...(comment.file !== undefined ? { file: comment.file } : {}),
    ...(comment.startLine !== undefined ? { startLine: comment.startLine } : {}),
    ...(comment.endLine !== undefined ? { endLine: comment.endLine } : {}),
    ...(comment.reviewerIndex !== undefined ? { reviewerIndex: comment.reviewerIndex } : {}),
    ...(comment.category !== undefined ? { category: comment.category } : {}),
    ...(comment.severity !== undefined ? { severity: comment.severity } : {}),
    ...(comment.createdAt !== undefined ? { createdAt: comment.createdAt } : {}),
    ...(comment.isClosed !== undefined ? { isClosed: comment.isClosed } : {}),
    ...(comment.likedBy !== undefined ? { likedBy: comment.likedBy } : {}),
    ...(comment.dislikedBy !== undefined ? { dislikedBy: comment.dislikedBy } : {}),
    revealName:
      authorRole === AUTHOR_ROLE.REVIEWER
        ? canRevealReviewerNames && revealedReviewerIndexes.has(Number(comment.reviewerIndex))
        : Boolean(comment.revealName),
  };
};

const mapBackendHistoryComment = (comment: BackendHistoryCommentDto): ReviewComment => ({
  id: comment.id,
  parentId: null,
  authorName: 'Участник обсуждения',
  authorRole: 'Participant',
  text: comment.text,
  replies: [],
  ...(comment.authorId !== undefined ? { authorId: comment.authorId } : {}),
  ...(comment.createdAt !== undefined ? { createdAt: comment.createdAt } : {}),
});

const mapBackendHistory = (iteration: BackendHistoryDto, taskId: EntityId): ReviewHistory => ({
  id: iteration.id,
  taskId: iteration.taskId ?? taskId,
  status: iteration.status ?? REVIEW_STATUS.NEW,
  uploadedAt: iteration.uploadedAt ?? '',
  files: (iteration.files ?? []).map(mapBackendFile),
  comments: (iteration.comments ?? []).map(mapBackendHistoryComment),
  finalReviews: iteration.finalReview ? [mapBackendFinalReview(iteration.finalReview)] : [],
  isHistory: true,
});

const mapBackendDetails = (review: BackendReviewDto, options: MapBackendDetailsOptions = {}): ReviewDetail => {
  const mappedFinalReviews = (review.finalReviews ?? []).map(mapBackendFinalReview);

  const finalReviews = options.useCurrentAssignmentResultOnly
    ? review.status === REVIEW_STATUS.COMPLETED
      ? [...mappedFinalReviews]
          .sort((left, right) => new Date(right.createdAt ?? '').getTime() - new Date(left.createdAt ?? '').getTime())
          .slice(0, 1)
      : []
    : mappedFinalReviews;

  const canRevealReviewerNames = review.taskStatus === 'DONE';

  const revealedReviewerIndexes = new Set<number>(
    finalReviews
      .filter((finalReview) => finalReview.revealName)
      .flatMap((finalReview) => (finalReview.reviewerIndex === undefined ? [] : [finalReview.reviewerIndex]))
  );

  return {
    id: review.id,
    projectId: review.projectId,
    taskId: review.taskId,
    status: review.status ?? REVIEW_STATUS.NEW,
    uploadedAt: review.uploadedAt ?? '',
    deadline: review.deadline ?? '',
    ...(review.completedAt !== undefined && review.completedAt !== null ? { reviewedAt: review.completedAt } : {}),
    files: (review.files ?? []).map(mapBackendFile),
    comments: (review.comments ?? []).map((comment) =>
      mapBackendComment(comment, canRevealReviewerNames, revealedReviewerIndexes)
    ),
    history: (review.history ?? []).map((iteration) => mapBackendHistory(iteration, review.taskId)),
    finalReviews,
    aiEvaluation: review.aiEvaluation ?? null,
    aiReviewEvaluation: review.aiReviewEvaluation ?? null,
    revealAuthorAfterReview: Boolean(review.revealAuthorAfterReview ?? review.revealAuthorSolution),
    ...(review.solutionId !== undefined ? { solutionId: review.solutionId } : {}),
    ...(review.reviewType !== undefined ? { reviewType: review.reviewType } : {}),
  };
};

export const reviewApi = {
  async getReviewByTaskId(taskId: EntityId): Promise<ReviewDetail> {
    const response = await apiRequest<BackendReviewDto>({ method: 'GET', url: `/api/v1/reviews/by-task/${taskId}` });

    return mapBackendDetails(response);
  },

  async getReviewById(reviewId: EntityId): Promise<ReviewDetail> {
    const response = await apiRequest<BackendReviewDto>({ method: 'GET', url: `/api/v1/reviews/${reviewId}` });

    return mapBackendDetails(response, { useCurrentAssignmentResultOnly: true });
  },

  async getReviewFileContent(reviewId: EntityId, filePath: string): Promise<ReviewFile> {
    const files = await apiRequest<BackendFileDto[]>({ method: 'GET', url: `/api/v1/reviews/${reviewId}/files` });
    const file = files.find((candidate) => candidate.path === filePath);

    if (!file) {
      throw new Error('File not found');
    }

    return mapBackendFile(file);
  },

  async submitFinalReview(reviewId: EntityId, payload: FinalReviewPayload): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({
      method: 'POST',
      url: `/api/v1/reviews/${reviewId}/verdict`,
      data: payload,
    });
  },

  async addReviewComment(reviewId: EntityId, payload: AddReviewCommentPayload): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({
      method: 'POST',
      url: '/api/v1/comments',
      data: { reviewId: Number(reviewId), ...payload },
    });
  },

  async replyToReviewComment(
    _reviewId: EntityId,
    commentId: EntityId,
    payload: ReplyCommentPayload
  ): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({
      method: 'POST',
      url: `/api/v1/comments/${commentId}/reply`,
      data: { text: payload.text },
    });
  },

  async toggleCommentLike(
    _reviewId: EntityId,
    commentId: EntityId,
    _userId: EntityId,
    isDislike = false
  ): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({
      method: 'PUT',
      url: `/api/v1/comments/${commentId}/reaction`,
      data: { reaction: isDislike ? 'DISLIKE' : 'LIKE' },
    });
  },

  async closeCommentThread(
    _reviewId: EntityId,
    commentId: EntityId,
    action: CommentThreadAction = 'close'
  ): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({
      method: 'PUT',
      url: `/api/v1/comments/${commentId}/state`,
      data: { action: action === 'close' ? 'CLOSE' : 'REOPEN' },
    });
  },

  async deleteReviewComment(_reviewId: EntityId, commentId: EntityId): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({ method: 'DELETE', url: `/api/v1/comments/${commentId}` });
  },

  async reportComment(
    _reviewId: EntityId,
    commentId: EntityId,
    payload: ReportCommentPayload
  ): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>({
      method: 'POST',
      url: `/api/v1/comments/${commentId}/report`,
      data: { reason: payload.reason, message: payload.message ?? payload.comment ?? '' },
    });
  },
};

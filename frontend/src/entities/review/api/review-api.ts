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
  comments?: BackendCommentDto[];
  finalReview?: BackendFinalReviewDto;
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

interface RevealedReviewerNames {
  byId: Map<number, string>;
  byIndex: Map<number, string>;
}

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
  canRevealAssigneeNames: boolean,
  revealedReviewerNames: RevealedReviewerNames
): ReviewComment => {
  const authorRole = getAuthorRole(comment.authorRole);
  const isReplyWithUnknownRole = comment.parentId !== null && !authorRole;

  const revealedReviewerName =
    canRevealReviewerNames && authorRole === AUTHOR_ROLE.REVIEWER
      ? ((comment.authorId !== undefined ? revealedReviewerNames.byId.get(Number(comment.authorId)) : undefined) ??
        (comment.reviewerIndex !== undefined
          ? revealedReviewerNames.byIndex.get(Number(comment.reviewerIndex))
          : undefined))
      : undefined;

  return {
    id: comment.id,
    parentId: comment.parentId,
    authorName: revealedReviewerName ?? (isReplyWithUnknownRole ? 'Участник обсуждения' : (comment.authorName ?? '')),
    authorRole,
    text: comment.text,
    replies: (comment.replies ?? []).map((reply) =>
      mapBackendComment(reply, canRevealReviewerNames, canRevealAssigneeNames, revealedReviewerNames)
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
        ? Boolean(revealedReviewerName)
        : authorRole === AUTHOR_ROLE.ASSIGNEE
          ? canRevealAssigneeNames
          : Boolean(comment.revealName),
  };
};

const mapBackendHistory = (
  iteration: BackendHistoryDto,
  taskId: EntityId,
  canRevealReviewerNames: boolean,
  canRevealAssigneeNames: boolean,
  revealedReviewerNames: RevealedReviewerNames
): ReviewHistory => ({
  id: iteration.id,
  taskId: iteration.taskId ?? taskId,
  status: iteration.status ?? REVIEW_STATUS.NEW,
  uploadedAt: iteration.uploadedAt ?? '',
  files: (iteration.files ?? []).map(mapBackendFile),
  comments: (iteration.comments ?? []).map((comment) =>
    mapBackendComment(comment, canRevealReviewerNames, canRevealAssigneeNames, revealedReviewerNames)
  ),
  finalReviews: iteration.finalReview ? [mapBackendFinalReview(iteration.finalReview)] : [],
  isHistory: true,
});

const mapBackendDetails = (review: BackendReviewDto): ReviewDetail => {
  const mappedFinalReviews = (review.finalReviews ?? []).map(mapBackendFinalReview);
  const isTaskCompleted = review.taskStatus === 'DONE';
  const finalReviews = mappedFinalReviews;

  const canRevealReviewerNames = isTaskCompleted;

  const canRevealAssigneeNames =
    isTaskCompleted && Boolean(review.revealAuthorSolution ?? review.revealAuthorAfterReview);

  const revealedReviewerNames = finalReviews.reduce<RevealedReviewerNames>(
    (names, finalReview) => {
      if (canRevealReviewerNames && finalReview.revealName && finalReview.reviewerName) {
        names.byId.set(Number(finalReview.reviewerId), finalReview.reviewerName);

        if (finalReview.reviewerIndex !== undefined) {
          names.byIndex.set(Number(finalReview.reviewerIndex), finalReview.reviewerName);
        }
      }

      return names;
    },
    { byId: new Map<number, string>(), byIndex: new Map<number, string>() }
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
      mapBackendComment(comment, canRevealReviewerNames, canRevealAssigneeNames, revealedReviewerNames)
    ),
    history: (review.history ?? []).map((iteration) =>
      mapBackendHistory(iteration, review.taskId, canRevealReviewerNames, canRevealAssigneeNames, revealedReviewerNames)
    ),
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

    return mapBackendDetails(response);
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

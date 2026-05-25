import { apiRequest } from '@/shared/api';
import { REVIEW_SORT, type ReviewSort, type ReviewStatus } from '../model';
import type { AssignedReview } from '../model/types';

interface ReviewListItemDto {
  id: number;
  taskId: number;
  taskName: string;
  project: {
    id: number;
    name: string;
  };
  organization: {
    id: number;
    name: string;
  } | null;
  uploadedAt: string;
  deadline: string;
  status: ReviewStatus;
  commentsCount: number;
  checkedInTime: boolean | null;
  completedAt: string;
}

const mapRealReview = (review: ReviewListItemDto): AssignedReview => ({
  id: review.id,
  taskId: review.taskId,
  taskName: review.taskName,
  project: review.project,
  organization: review.organization,
  uploadedAt: review.uploadedAt,
  responseDeadline: review.deadline,
  status: review.status,
  commentsCount: review.commentsCount,
  checkedByReviewer: review.checkedInTime === true,
  reviewedAt: review.completedAt || null,
});

const sortByDeadline = (items: AssignedReview[], sortDirection: ReviewSort = REVIEW_SORT.NEAREST_FIRST) => {
  const direction = sortDirection === REVIEW_SORT.FARTHEST_FIRST ? -1 : 1;

  return [...items].sort((left, right) => {
    return direction * (new Date(left.responseDeadline).getTime() - new Date(right.responseDeadline).getTime());
  });
};

export interface GetAssignedReviewsParams {
  status?: ReviewStatus | '';
  sort?: ReviewSort;
}

export const reviewsApi = {
  async getAssignedReviews(
    _viewerId: number | string,
    params: GetAssignedReviewsParams = {}
  ): Promise<AssignedReview[]> {
    const { status = '', sort = REVIEW_SORT.NEAREST_FIRST } = params;

    const response = await apiRequest<ReviewListItemDto[]>({
      method: 'GET',
      url: '/api/v1/reviews',
    });

    const filtered = response.map(mapRealReview).filter((review) => !status || review.status === status);

    return sortByDeadline(filtered, sort);
  },
};

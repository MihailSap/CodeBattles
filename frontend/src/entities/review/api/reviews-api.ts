import { MOCK_ASSIGNED_REVIEWS } from '@/entities/project';
import { REVIEW_SORT, REVIEWS_NETWORK_DELAY_MS, REVIEWS_PAGE_SIZE_DEFAULT } from '../model';
import type { AssignedReview } from '../model/types';
import type { PaginationParams, PaginatedResponse } from '@/shared/api';

const withDelay = (value: LegacyValue, ms: LegacyValue = REVIEWS_NETWORK_DELAY_MS) =>
  new Promise((resolve: LegacyValue) => {
    setTimeout(() => resolve(value), ms);
  });

const clone = (value: LegacyValue) => JSON.parse(JSON.stringify(value));

const paginate = <T>(
  items: T[],
  page: number = 1,
  pageSize: number = REVIEWS_PAGE_SIZE_DEFAULT
): PaginatedResponse<T> => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedPageSize = Math.max(1, Number(pageSize) || REVIEWS_PAGE_SIZE_DEFAULT);
  const start = (normalizedPage - 1) * normalizedPageSize;
  const end = start + normalizedPageSize;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));

  return {
    items: items.slice(start, end),
    content: items.slice(start, end),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    size: normalizedPageSize,
    totalItems,
    total: totalItems,
    totalPages,
    hasNext: normalizedPage < totalPages,
    hasPrevious: normalizedPage > 1,
  };
};

const sortByDeadline = (items: AssignedReview[], sortDirection: string = REVIEW_SORT.NEAREST_FIRST) => {
  const direction = sortDirection === REVIEW_SORT.FARTHEST_FIRST ? -1 : 1;

  return [...items].sort((left, right) => {
    return direction * (new Date(left.responseDeadline).getTime() - new Date(right.responseDeadline).getTime());
  });
};

export interface GetAssignedReviewsParams extends PaginationParams {
  status?: string;
  sort?: string;
}

export const reviewsApi = {
  async getAssignedReviews(
    viewerId: number | string,
    params: GetAssignedReviewsParams = {}
  ): Promise<PaginatedResponse<AssignedReview>> {
    const { page = 1, pageSize = REVIEWS_PAGE_SIZE_DEFAULT, status = '', sort = REVIEW_SORT.NEAREST_FIRST } = params;

    const filtered = (MOCK_ASSIGNED_REVIEWS as AssignedReview[])
      .filter((review) => Number(review.reviewerId) === Number(viewerId))
      .filter((review) => {
        if (!status) {
          return true;
        }

        return review.status === status;
      });

    const sorted = sortByDeadline(filtered, sort);

    return withDelay(clone(paginate(sorted, page, pageSize))) as Promise<PaginatedResponse<AssignedReview>>;
  },
};

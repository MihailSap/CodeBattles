import { MOCK_ASSIGNED_REVIEWS } from '@/entities/project';
import { REVIEW_SORT, REVIEWS_NETWORK_DELAY_MS, REVIEWS_PAGE_SIZE_DEFAULT } from '../model';

const withDelay = (value, ms = REVIEWS_NETWORK_DELAY_MS) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

const clone = (value) => JSON.parse(JSON.stringify(value));

const paginate = (items, page = 1, pageSize = REVIEWS_PAGE_SIZE_DEFAULT) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedPageSize = Math.max(1, Number(pageSize) || REVIEWS_PAGE_SIZE_DEFAULT);
  const start = (normalizedPage - 1) * normalizedPageSize;
  const end = start + normalizedPageSize;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));

  return {
    items: items.slice(start, end),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalItems,
    totalPages,
    hasNext: normalizedPage < totalPages,
    hasPrevious: normalizedPage > 1,
  };
};

const sortByDeadline = (items, sortDirection = REVIEW_SORT.NEAREST_FIRST) => {
  const direction = sortDirection === REVIEW_SORT.FARTHEST_FIRST ? -1 : 1;

  return [...items].sort((left, right) => {
    return direction * (new Date(left.responseDeadline).getTime() - new Date(right.responseDeadline).getTime());
  });
};

export const reviewsApi = {
  async getAssignedReviews(viewerId, params = {}) {
    const { page = 1, pageSize = REVIEWS_PAGE_SIZE_DEFAULT, status = '', sort = REVIEW_SORT.NEAREST_FIRST } = params;

    const filtered = MOCK_ASSIGNED_REVIEWS.filter((review) => review.reviewerId === Number(viewerId)).filter(
      (review) => {
        if (!status) {
          return true;
        }

        return review.status === status;
      }
    );

    const sorted = sortByDeadline(filtered, sort);

    return withDelay(clone(paginate(sorted, page, pageSize)));
  },
};

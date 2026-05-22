import { MOCK_ASSIGNED_REVIEWS } from '@/entities/project';
import { REVIEW_SORT, REVIEWS_NETWORK_DELAY_MS, REVIEWS_PAGE_SIZE_DEFAULT } from '../model';

const withDelay = (value: LegacyValue, ms: LegacyValue = REVIEWS_NETWORK_DELAY_MS) =>
  new Promise((resolve: LegacyValue) => {
    setTimeout(() => resolve(value), ms);
  });

const clone = (value: LegacyValue) => JSON.parse(JSON.stringify(value));

const paginate = (items: LegacyValue, page: LegacyValue = 1, pageSize: LegacyValue = REVIEWS_PAGE_SIZE_DEFAULT) => {
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

const sortByDeadline = (items: LegacyValue, sortDirection: LegacyValue = REVIEW_SORT.NEAREST_FIRST) => {
  const direction = sortDirection === REVIEW_SORT.FARTHEST_FIRST ? -1 : 1;

  return [...items].sort((left: LegacyValue, right: LegacyValue) => {
    return direction * (new Date(left.responseDeadline).getTime() - new Date(right.responseDeadline).getTime());
  });
};

export const reviewsApi: LegacyValue = {
  async getAssignedReviews(viewerId: LegacyValue, params: LegacyValue = {}) {
    const { page = 1, pageSize = REVIEWS_PAGE_SIZE_DEFAULT, status = '', sort = REVIEW_SORT.NEAREST_FIRST } = params;

    const filtered = MOCK_ASSIGNED_REVIEWS.filter(
      (review: LegacyValue) => review.reviewerId === Number(viewerId)
    ).filter((review: LegacyValue) => {
      if (!status) {
        return true;
      }

      return review.status === status;
    });

    const sorted = sortByDeadline(filtered, sort);

    return withDelay(clone(paginate(sorted, page, pageSize)));
  },
};

import { baseApi, toQueryResult } from '@/shared/api';
import { reviewsApi } from './reviews-api';
import type { GetAssignedReviewsParams } from './reviews-api';
import type { AssignedReview } from '../model/types';
import type { PaginatedResponse } from '@/shared/api';

export const reviewApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAssignedReviews: build.query<PaginatedResponse<AssignedReview>, { viewerId: number | string; params?: GetAssignedReviewsParams }>({
      queryFn: ({ viewerId, params = {} }) =>
        toQueryResult(() => reviewsApi.getAssignedReviews(viewerId, params)),
      providesTags: [
        {
          type: 'Review' as const,
          id: 'LIST',
        },
      ],
    }),
  }),
});
export const { useGetAssignedReviewsQuery } = reviewApiSlice;

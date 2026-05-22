import { baseApi, toQueryResult } from '@/shared/api';
import { reviewsApi } from './reviews-api';

export const reviewApiSlice = baseApi.injectEndpoints({
  endpoints: (build: LegacyValue) => ({
    getAssignedReviews: build.query({
      queryFn: ({ viewerId, params = {} }: LegacyValue) =>
        toQueryResult(() => reviewsApi.getAssignedReviews(viewerId, params)),
      providesTags: [
        {
          type: 'Review',
          id: 'LIST',
        },
      ],
    }),
  }),
});
export const { useGetAssignedReviewsQuery } = reviewApiSlice;

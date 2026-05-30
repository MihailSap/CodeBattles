import { baseApi, toQueryResult } from '@/shared/api';
import type { EntityId } from '@/entities/project/@x/review';
import type { AssignedReview, ReviewDetail, ReviewFile } from '../model/types';
import { reviewApi } from './review-api';
import { reviewsApi } from './reviews-api';
import type { GetAssignedReviewsParams } from './reviews-api';

export const reviewApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAssignedReviews: build.query<AssignedReview[], { viewerId: number | string; params?: GetAssignedReviewsParams }>(
      {
        queryFn: ({ viewerId, params = {} }) => toQueryResult(() => reviewsApi.getAssignedReviews(viewerId, params)),
        providesTags: [
          {
            type: 'Review' as const,
            id: 'LIST',
          },
        ],
      }
    ),
    getReviewById: build.query<ReviewDetail, EntityId>({
      queryFn: (reviewId) => toQueryResult(() => reviewApi.getReviewById(reviewId)),
      providesTags: (_result, _error, reviewId) => [
        {
          type: 'Review',
          id: reviewId,
        },
      ],
    }),
    getReviewByTaskId: build.query<ReviewDetail, EntityId>({
      queryFn: (taskId) => toQueryResult(() => reviewApi.getReviewByTaskId(taskId)),
      providesTags: (_result, _error, taskId) => [
        {
          type: 'Review',
          id: `TASK-${taskId}`,
        },
        {
          type: 'Task',
          id: taskId,
        },
      ],
    }),
    getReviewFileContent: build.query<ReviewFile, { reviewIdOrTaskId: EntityId; filePath: string }>({
      queryFn: ({ reviewIdOrTaskId, filePath }) =>
        toQueryResult(() => reviewApi.getReviewFileContent(reviewIdOrTaskId, filePath)),
      providesTags: (_result, _error, { reviewIdOrTaskId, filePath }) => [
        {
          type: 'Review',
          id: `FILE-${reviewIdOrTaskId}-${filePath}`,
        },
      ],
    }),
    invalidateReview: build.mutation<null, void>({
      queryFn: async () => ({
        data: null,
      }),
      invalidatesTags: [
        {
          type: 'Review' as const,
          id: 'LIST',
        },
      ],
    }),
  }),
});
export const {
  useGetAssignedReviewsQuery,
  useGetReviewByIdQuery,
  useGetReviewByTaskIdQuery,
  useGetReviewFileContentQuery,
  useInvalidateReviewMutation,
} = reviewApiSlice;

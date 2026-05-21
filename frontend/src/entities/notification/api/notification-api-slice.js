import { baseApi, toQueryResult } from '@/shared/api';
import { isNotificationExpired } from '../lib/notification-utils';
import { notificationsApi } from './notifications-api';

const notificationListTag = { type: 'Notification', id: 'LIST' };

const removeExpiredNotifications = (draft) => {
  const activeNotifications = draft.filter((notification) => !isNotificationExpired(notification));
  draft.splice(0, draft.length, ...activeNotifications);
};

const upsertNotification = (draft, notification) => {
  const existingIndex = draft.findIndex((item) => item.id === notification.id);

  if (existingIndex >= 0) {
    draft[existingIndex] = notification;
  } else {
    draft.unshift(notification);
  }

  draft.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
};

export const notificationApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query({
      queryFn: () => toQueryResult(() => notificationsApi.getNotifications()),
      providesTags: (result) =>
        result
          ? [...result.map((notification) => ({ type: 'Notification', id: notification.id })), notificationListTag]
          : [notificationListTag],
      async onCacheEntryAdded(_arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let unsubscribe = () => {};
        let expirationTimerId = null;

        try {
          await cacheDataLoaded;

          unsubscribe = notificationsApi.subscribe((event) => {
            if (event.type === 'notification.upserted' && event.notification) {
              updateCachedData((draft) => {
                upsertNotification(draft, event.notification);
                removeExpiredNotifications(draft);
              });
            }

            if (event.type === 'notification.deleted' && event.notificationId) {
              updateCachedData((draft) => {
                const index = draft.findIndex((notification) => notification.id === event.notificationId);

                if (index >= 0) {
                  draft.splice(index, 1);
                }
              });
            }
          });

          expirationTimerId = window.setInterval(() => {
            updateCachedData(removeExpiredNotifications);
          }, 30000);

          await cacheEntryRemoved;
        } finally {
          if (expirationTimerId) {
            window.clearInterval(expirationTimerId);
          }

          unsubscribe();
        }
      },
    }),
    markAllNotificationsRead: build.mutation({
      queryFn: () => toQueryResult(() => notificationsApi.markAllRead()),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            draft.forEach((notification) => {
              notification.isRead = true;
            });
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [notificationListTag],
    }),
    deleteNotification: build.mutation({
      queryFn: (notificationId) => toQueryResult(() => notificationsApi.deleteNotification(notificationId)),
      async onQueryStarted(notificationId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            const index = draft.findIndex((notification) => notification.id === notificationId);

            if (index >= 0) {
              draft.splice(index, 1);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, notificationId) => [
        { type: 'Notification', id: notificationId },
        notificationListTag,
      ],
    }),
    completeNotification: build.mutation({
      queryFn: (payload) => toQueryResult(() => notificationsApi.completeNotification(payload)),
      async onQueryStarted(payload, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            const matchesPayload = (notification) => {
              if (!notification.completion || notification.completion.action !== payload.action) {
                return false;
              }

              const left = notification.completion.target || {};
              const right = payload.target || {};
              const hasDifferentUser = left.userId && right.userId && Number(left.userId) !== Number(right.userId);

              return (
                !hasDifferentUser &&
                left.kind === right.kind &&
                String(left.reviewId || left.taskId || left.organizationId || left.kind) ===
                  String(right.reviewId || right.taskId || right.organizationId || right.kind)
              );
            };

            const activeNotifications = draft.filter((notification) => !matchesPayload(notification));
            draft.splice(0, draft.length, ...activeNotifications);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [notificationListTag],
    }),
  }),
});

export const {
  useCompleteNotificationMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} = notificationApiSlice;

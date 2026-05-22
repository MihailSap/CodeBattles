import { baseApi, toQueryResult } from '@/shared/api';
import { isNotificationExpired } from '../lib/notification-utils';
import { notificationsApi } from './notifications-api';

const notificationListTag = {
  type: 'Notification',
  id: 'LIST',
};

const removeExpiredNotifications = (draft: LegacyValue) => {
  const activeNotifications = draft.filter((notification: LegacyValue) => !isNotificationExpired(notification));
  draft.splice(0, draft.length, ...activeNotifications);
};

const upsertNotification = (draft: LegacyValue, notification: LegacyValue) => {
  const existingIndex = draft.findIndex((item: LegacyValue) => item.id === notification.id);

  if (existingIndex >= 0) {
    draft[existingIndex] = notification;
  } else {
    draft.unshift(notification);
  }

  draft.sort(
    (left: LegacyValue, right: LegacyValue) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};

export const notificationApiSlice = baseApi.injectEndpoints({
  endpoints: (build: LegacyValue) => ({
    getNotifications: build.query({
      queryFn: () => toQueryResult(() => notificationsApi.getNotifications()),
      providesTags: (result: LegacyValue) =>
        result
          ? [
              ...result.map((notification: LegacyValue) => ({
                type: 'Notification',
                id: notification.id,
              })),
              notificationListTag,
            ]
          : [notificationListTag],
      async onCacheEntryAdded(
        _arg: LegacyValue,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }: LegacyValue
      ) {
        let unsubscribe = () => {};
        let expirationTimerId = null;

        try {
          await cacheDataLoaded;

          unsubscribe = notificationsApi.subscribe((event: LegacyValue) => {
            if (event.type === 'notification.upserted' && event.notification) {
              updateCachedData((draft: LegacyValue) => {
                upsertNotification(draft, event.notification);
                removeExpiredNotifications(draft);
              });
            }

            if (event.type === 'notification.deleted' && event.notificationId) {
              updateCachedData((draft: LegacyValue) => {
                const index = draft.findIndex((notification: LegacyValue) => notification.id === event.notificationId);

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
      async onQueryStarted(_arg: LegacyValue, { dispatch, queryFulfilled }: LegacyValue) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', undefined, (draft: LegacyValue) => {
            draft.forEach((notification: LegacyValue) => {
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
      queryFn: (notificationId: LegacyValue) =>
        toQueryResult(() => notificationsApi.deleteNotification(notificationId)),
      async onQueryStarted(notificationId: LegacyValue, { dispatch, queryFulfilled }: LegacyValue) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', undefined, (draft: LegacyValue) => {
            const index = draft.findIndex((notification: LegacyValue) => notification.id === notificationId);

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
      invalidatesTags: (_result: LegacyValue, _error: LegacyValue, notificationId: LegacyValue) => [
        {
          type: 'Notification',
          id: notificationId,
        },
        notificationListTag,
      ],
    }),
    completeNotification: build.mutation({
      queryFn: (payload: LegacyValue) => toQueryResult(() => notificationsApi.completeNotification(payload)),
      async onQueryStarted(payload: LegacyValue, { dispatch, queryFulfilled }: LegacyValue) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', undefined, (draft: LegacyValue) => {
            const matchesPayload = (notification: LegacyValue) => {
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

            const activeNotifications = draft.filter((notification: LegacyValue) => !matchesPayload(notification));
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

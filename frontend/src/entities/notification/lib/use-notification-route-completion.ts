import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getNotificationCompletionPayloadsForPath } from './notification-utils';
import { useCompleteNotificationMutation } from '../api/notification-api-slice';

export const useNotificationRouteCompletion = () => {
  const location = useLocation();
  const [completeNotification] = useCompleteNotificationMutation();
  const completedPathRef = useRef<LegacyValue>(null);

  useEffect(() => {
    if (completedPathRef.current === location.pathname) {
      return;
    }

    completedPathRef.current = location.pathname;
    const payloads = getNotificationCompletionPayloadsForPath(location.pathname);

    payloads.forEach((payload: LegacyValue) => {
      completeNotification(payload);
    });
  }, [completeNotification, location.pathname]);
};

package ru.urfu.backend.service;

import ru.urfu.backend.dto.notification.CompleteNotificationResponse;
import ru.urfu.backend.dto.notification.DeleteNotificationResponse;
import ru.urfu.backend.dto.notification.MarkAllNotificationsReadResponse;
import ru.urfu.backend.dto.notification.NotificationCompletionDto;
import ru.urfu.backend.dto.notification.NotificationDto;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;

import java.util.List;

public interface NotificationService {

    List<NotificationDto> getActive(User user);

    MarkAllNotificationsReadResponse markAllRead(User user);

    DeleteNotificationResponse delete(User user, Long notificationId);

    CompleteNotificationResponse complete(User user, NotificationCompletionDto completion);

    void notifyOrganizationJoinRequest(Organization organization, User requester);

    void notifyOrganizationJoinApproved(Organization organization, User requester);

    void notifyOrganizationJoinRejected(Organization organization, User requester);

    void notifyTaskAssigned(Task task);

    void notifySolutionSubmitted(Task task);

    void notifyReviewSubmitted(Review review);

    void notifyReviewReworkRequired(Task task);

    void notifyReviewExpiredWithoutDecision(Task task);

    void notifyAiReviewCompleted(Task task);

    void notifyThreadReply(Comment parentComment, Comment reply);

    void notifyTaskCompleted(Task task);

    void notifyAchievementReceived(User user, String achievementTitle);

    void notifyNewAchievements(User user, List<Long> achievementIdsBeforeAction);
}

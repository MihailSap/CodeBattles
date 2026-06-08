package ru.urfu.backend.service.impl;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import ru.urfu.backend.dto.notification.CompleteNotificationResponse;
import ru.urfu.backend.dto.notification.DeleteNotificationResponse;
import ru.urfu.backend.dto.notification.MarkAllNotificationsReadResponse;
import ru.urfu.backend.dto.notification.NotificationCompletionDto;
import ru.urfu.backend.dto.notification.NotificationDto;
import ru.urfu.backend.dto.notification.NotificationTargetDto;
import ru.urfu.backend.dto.achievement.AchievementDto;
import ru.urfu.backend.mapper.NotificationMapper;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.Notification;
import ru.urfu.backend.model.NotificationSettings;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.ReviewIteration;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.model.UserProject;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.model.enums.AiEvaluationStatus;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.NotificationCompletionAction;
import ru.urfu.backend.model.enums.NotificationTargetKind;
import ru.urfu.backend.model.enums.NotificationType;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.ReviewVerdictType;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.model.enums.UserTaskType;
import ru.urfu.backend.repository.NotificationRepository;
import ru.urfu.backend.service.AchievementService;
import ru.urfu.backend.service.NotificationRealtimeService;
import ru.urfu.backend.service.NotificationService;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final DateTimeFormatter DEADLINE_FORMATTER =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm", Locale.forLanguageTag("ru-RU"));

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final NotificationRealtimeService notificationRealtimeService;
    private final AchievementService achievementService;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            NotificationMapper notificationMapper,
            NotificationRealtimeService notificationRealtimeService,
            AchievementService achievementService
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.notificationRealtimeService = notificationRealtimeService;
        this.achievementService = achievementService;
    }

    @Transactional
    @Override
    public List<NotificationDto> getActive(User user) {
        LocalDateTime now = now();
        return notificationRepository.findByUserAndExpiresAtAfterOrderByCreatedAtDesc(user, now)
                .stream()
                .map(notificationMapper::mapToDto)
                .toList();
    }

    @Transactional
    @Override
    public MarkAllNotificationsReadResponse markAllRead(User user) {
        List<Notification> notifications = notificationRepository.findByUserAndExpiresAtAfter(user, now());
        int updatedCount = 0;
        for (Notification notification : notifications) {
            if (!Boolean.TRUE.equals(notification.getRead())) {
                notification.setRead(true);
                notificationRepository.save(notification);
                updatedCount++;
            }
        }
        return new MarkAllNotificationsReadResponse(updatedCount);
    }

    @Transactional
    @Override
    public DeleteNotificationResponse delete(User user, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserAndExpiresAtAfter(notificationId, user, now())
                .orElseThrow(() -> new RuntimeException("404 NOTIFICATION_NOT_FOUND"));
        String id = String.valueOf(notification.getId());
        Long userId = user.getId();
        notificationRepository.delete(notification);
        sendDeletedAfterCommit(userId, id);
        return new DeleteNotificationResponse(id);
    }

    @Transactional
    @Override
    public CompleteNotificationResponse complete(User user, NotificationCompletionDto completion) {
        NotificationCompletionAction action = parseAction(completion.action());
        NotificationTargetDto target = completion.target();
        List<Notification> notifications = notificationRepository
                .findByUserAndCompletionActionAndExpiresAtAfter(user, action, now())
                .stream()
                .filter(notification -> matchesTarget(notification, target))
                .toList();

        List<String> deletedIds = deleteAll(notifications);
        return new CompleteNotificationResponse(deletedIds);
    }

    @Transactional
    @Override
    public void notifyOrganizationJoinRequest(Organization organization, User requester) {
        for (UserOrganization member : organization.getMembers()) {
            if (Boolean.TRUE.equals(member.getEnabled()) && Boolean.TRUE.equals(member.getAdmin())) {
                create(
                        member.getUser(),
                        NotificationType.ORGANIZATION_JOIN_REQUEST,
                        "Новая заявка в организацию",
                        "Поступил запрос на вступление в организацию %s.".formatted(organization.getTitle()),
                        builder -> {
                            builder.organizationTarget(organization);
                            builder.completionAction(NotificationCompletionAction.RESOLVE_ORGANIZATION_JOIN_REQUEST);
                            builder.targetUserId(requester.getId());
                            builder.expiresAt(now().plusDays(5));
                        }
                );
            }
        }
    }

    @Transactional
    @Override
    public void notifyOrganizationJoinApproved(Organization organization, User requester) {
        completeJoinRequestNotifications(organization, requester);
        create(
                requester,
                NotificationType.ORGANIZATION_JOIN_APPROVED,
                "Заявка принята",
                "Вы были приняты в организацию %s.".formatted(organization.getTitle()),
                builder -> {
                    builder.organizationTarget(organization);
                    builder.completionAction(NotificationCompletionAction.OPEN_ORGANIZATION);
                    builder.expiresAt(now().plusDays(3));
                }
        );
    }

    @Transactional
    @Override
    public void notifyOrganizationJoinRejected(Organization organization, User requester) {
        completeJoinRequestNotifications(organization, requester);
        create(
                requester,
                NotificationType.ORGANIZATION_JOIN_REJECTED,
                "Заявка отклонена",
                "Ваш запрос на вступление в организацию %s был отклонен.".formatted(organization.getTitle()),
                builder -> builder.expiresAt(now().plusDays(3))
        );
    }

    @Transactional
    @Override
    public void notifyTaskAssigned(Task task) {
        LocalDateTime deadline = task.getDeadline();
        for (UserTask userTask : task.getUsers()) {
            if (UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())) {
                create(
                        userTask.getUser(),
                        NotificationType.TASK_ASSIGNED,
                        "Назначена задача",
                        "Вы назначены исполнителем на задачу в проекте %s. Дедлайн сдачи: %s."
                                .formatted(task.getProject().getTitle(), formatDeadline(deadline)),
                        builder -> {
                            builder.taskTarget(task);
                            builder.deadline(deadline);
                            builder.completionAction(NotificationCompletionAction.SUBMIT_TASK_SOLUTION);
                            builder.expiresAt(minDate(now().plusDays(10), deadline));
                        }
                );
            }
        }
    }

    @Transactional
    @Override
    public void notifySolutionSubmitted(Task task) {
        deleteActiveByCompletion(task, NotificationCompletionAction.SUBMIT_TASK_SOLUTION);
        for (Review review : task.getReviews()) {
            if (review.getUser() == null) {
                continue;
            }
            ReviewIteration iteration = review.getLastIteration();
            LocalDateTime deadline = iteration == null ? null : iteration.getDeadline();
            create(
                    review.getUser(),
                    NotificationType.REVIEW_AVAILABLE,
                    "Новое решение на ревью",
                    "Доступно новое решение на ревью. Дедлайн ревью: %s.".formatted(formatDeadline(deadline)),
                    builder -> {
                        builder.reviewTarget(review);
                        builder.deadline(deadline);
                        builder.completionAction(NotificationCompletionAction.SUBMIT_REVIEW_RESULT);
                        builder.expiresAt(minDate(now().plusDays(10), deadline));
                    }
            );
        }
    }

    @Transactional
    @Override
    public void notifyReviewSubmitted(Review review) {
        deleteActiveByCompletion(review, NotificationCompletionAction.SUBMIT_REVIEW_RESULT);
        Task task = review.getTask();
        if (isAllReviewsApproved(task)) {
            notifyReviewApprovedByAll(task);
        }
    }

    @Transactional
    @Override
    public void notifyReviewReworkRequired(Task task) {
        for (UserTask userTask : task.getUsers()) {
            if (UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())) {
                createOncePerTask(
                        userTask.getUser(),
                        NotificationType.REVIEW_REWORK_REQUIRED,
                        task,
                        "Нужны доработки",
                        "Ваше решение оценили все ревьюеры. Необходимо внести правки.",
                        builder -> {
                            builder.taskTarget(task);
                            builder.completionAction(NotificationCompletionAction.OPEN_TASK);
                            builder.expiresAt(now().plusDays(3));
                        }
                );
            }
        }
    }

    @Transactional
    @Override
    public void notifyReviewExpiredWithoutDecision(Task task) {
        for (UserTask userTask : task.getUsers()) {
            if (UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())) {
                createOncePerTask(
                        userTask.getUser(),
                        NotificationType.REVIEW_EXPIRED_WITHOUT_DECISION,
                        task,
                        "Ревью не завершено в срок",
                        "Ни один из ревьюеров не проверил ваше решение в срок. "
                                + "Вы можете переотправить решение на проверку повторно.",
                        builder -> {
                            builder.taskTarget(task);
                            builder.completionAction(NotificationCompletionAction.OPEN_TASK);
                            builder.expiresAt(now().plusDays(3));
                        }
                );
            }
        }
    }

    @Transactional
    @Override
    public void notifyAiReviewCompleted(Task task) {
        if (!TaskStatus.DONE.equals(task.getStatus()) && !TaskStatus.REWORK.equals(task.getStatus())) {
            return;
        }

        boolean aiReviewFinished = ReviewType.AI_ONLY.equals(task.getReviewType())
                || task.getReviews().stream()
                .map(Review::getLastIteration)
                .filter(Objects::nonNull)
                .map(ReviewIteration::getAiReviewEvaluation)
                .filter(Objects::nonNull)
                .anyMatch(evaluation -> AiEvaluationStatus.COMPLETED.equals(evaluation.getStatus()));

        if (!aiReviewFinished) {
            return;
        }

        for (UserTask userTask : task.getUsers()) {
            if (UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())) {
                createOncePerTask(
                        userTask.getUser(),
                        NotificationType.AI_REVIEW_COMPLETED,
                        task,
                        "AI проверил решение",
                        "Ваше решение было проверено. Вы можете посмотреть комментарии и оценки.",
                        builder -> {
                            builder.taskTarget(task);
                            builder.completionAction(NotificationCompletionAction.OPEN_TASK);
                            builder.expiresAt(now().plusDays(3));
                        }
                );
            }
        }
    }

    @Transactional
    @Override
    public void notifyThreadReply(Comment parentComment, Comment reply) {
        User recipient = parentComment.getUser();
        if (recipient == null || recipient.equals(reply.getUser())) {
            return;
        }

        Task task = parentComment.getReviewIteration().getReview().getTask();
        Review review = parentComment.getReviewIteration().getReview();
        LocalDateTime currentTime = now();
        boolean recipientIsAssignee = CommentAuthorRole.ASSIGNEE.equals(parentComment.getCommentAuthorRole());
        Notification notification = recipientIsAssignee
                ? notificationRepository
                        .findFirstByUserAndTypeAndTaskIdAndExpiresAtAfter(
                                recipient,
                                NotificationType.THREAD_REPLY,
                                task.getId(),
                                currentTime
                        )
                        .orElse(null)
                : notificationRepository
                        .findFirstByUserAndTypeAndTaskIdAndReviewIdAndExpiresAtAfter(
                                recipient,
                                NotificationType.THREAD_REPLY,
                                task.getId(),
                                review.getId(),
                                currentTime
                        )
                        .orElse(null);

        if (notification == null) {
            create(
                    recipient,
                    NotificationType.THREAD_REPLY,
                    "Ответ в обсуждении",
                    "Был получен ответ на ваш комментарий в задаче %s.".formatted(task.getTitle()),
                    builder -> {
                        if (recipientIsAssignee) {
                            builder.taskTarget(task);
                            builder.completionAction(NotificationCompletionAction.OPEN_TASK);
                        } else {
                            builder.reviewTarget(review);
                            builder.completionAction(NotificationCompletionAction.OPEN_REVIEW);
                        }
                        builder.threadReplyCount(1);
                        builder.expiresAt(currentTime.plusDays(3));
                    }
            );
            return;
        }

        notification.setRead(false);
        notification.setCreatedAt(currentTime);
        notification.setExpiresAt(currentTime.plusDays(3));
        notification.setThreadReplyCount((notification.getThreadReplyCount() == null ? 1 : notification.getThreadReplyCount()) + 1);
        notification.setText("Было получено несколько ответов на ваши комментарии в задаче %s.".formatted(task.getTitle()));
        applyThreadReplyDestination(notification, recipientIsAssignee, task, review);
        notificationRepository.save(notification);
        sendUpsertAfterCommit(recipient.getId(), notificationMapper.mapToDto(notification));
    }

    @Transactional
    @Override
    public void notifyTaskCompleted(Task task) {
        deleteActiveByCompletion(task, NotificationCompletionAction.ACCEPT_REVIEW_RESULT);
        for (Review review : task.getReviews()) {
            if (review.getUser() == null) {
                continue;
            }
            create(
                    review.getUser(),
                    NotificationType.TASK_COMPLETED_REVIEWER,
                    "Задача завершена",
                    "Задача %s была завершена. Баллы за ревью доступны на странице Лидерборда."
                            .formatted(task.getTitle()),
                    builder -> {
                        builder.leaderboardTarget();
                        builder.taskId(task.getId());
                        builder.taskName(task.getTitle());
                        builder.completionAction(NotificationCompletionAction.OPEN_LEADERBOARD);
                        builder.expiresAt(now().plusDays(7));
                    }
            );
        }

        for (UserProject userProject : task.getProject().getUsers()) {
            if (ProjectMemberRole.OWNER.equals(userProject.getProjectMemberRole())) {
                create(
                        userProject.getUser(),
                        NotificationType.TASK_COMPLETED_OWNER,
                        "Задача завершена",
                        "Задача %s была завершена.".formatted(task.getTitle()),
                        builder -> {
                            builder.taskTarget(task);
                            builder.completionAction(NotificationCompletionAction.OPEN_TASK);
                            builder.expiresAt(now().plusDays(3));
                        }
                );
            }
        }
    }

    @Transactional
    @Override
    public void notifyAchievementReceived(User user, String achievementTitle) {
        create(
                user,
                NotificationType.ACHIEVEMENT_RECEIVED,
                "Получено достижение",
                "Получено достижение %s!".formatted(achievementTitle),
                builder -> {
                    builder.profileTarget();
                    builder.completionAction(NotificationCompletionAction.OPEN_PROFILE);
                    builder.expiresAt(now().plusDays(5));
                }
        );
    }

    @Transactional
    @Override
    public void notifyNewAchievements(User user, List<Long> achievementIdsBeforeAction) {
        List<Long> safeBefore = achievementIdsBeforeAction == null ? List.of() : achievementIdsBeforeAction;
        List<Long> achievementIdsAfterAction = achievementService.getReceivedAchievementIds(user);
        for (Long achievementId : achievementIdsAfterAction) {
            if (!safeBefore.contains(achievementId)) {
                String achievementName = achievementService.getAchievements(user, true)
                        .stream()
                        .filter(achievement -> achievement.id().equals(achievementId))
                        .findFirst()
                        .map(AchievementDto::name)
                        .orElse("новое достижение");
                notifyAchievementReceived(user, achievementName);
            }
        }
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void deleteExpiredNotifications() {
        List<Notification> expired = notificationRepository.findAll()
                .stream()
                .filter(notification -> !notification.getExpiresAt().isAfter(now()))
                .toList();
        deleteAll(expired);
    }

    private void notifyReviewApprovedByAll(Task task) {
        for (UserTask userTask : task.getUsers()) {
            if (UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())) {
                createOncePerTask(
                        userTask.getUser(),
                        NotificationType.REVIEW_APPROVED_BY_ALL,
                        task,
                        "Решение одобрено",
                        "Ваше решение одобрили все ревьюеры. "
                                + "Вы можете посмотреть комментарии и принять результат проверки.",
                        builder -> {
                            builder.taskTarget(task);
                            builder.completionAction(NotificationCompletionAction.ACCEPT_REVIEW_RESULT);
                            builder.expiresAt(now().plusDays(7));
                        }
                );
            }
        }
    }

    private Notification create(
            User user,
            NotificationType type,
            String title,
            String text,
            java.util.function.Consumer<NotificationBuilder> customizer
    ) {
        if (!isAllowedBySettings(user, type)) {
            return null;
        }

        LocalDateTime currentTime = now();
        NotificationBuilder builder = new NotificationBuilder(currentTime);
        customizer.accept(builder);
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setText(text);
        notification.setRead(false);
        notification.setCreatedAt(currentTime);
        notification.setExpiresAt(builder.expiresAt == null ? currentTime.plusDays(defaultTtlDays(type)) : builder.expiresAt);
        notification.setDeadline(builder.deadline);
        notification.setTargetKind(builder.targetKind);
        notification.setOrganizationId(builder.organizationId);
        notification.setProjectId(builder.projectId);
        notification.setTaskId(builder.taskId);
        notification.setReviewId(builder.reviewId);
        notification.setTargetUserId(builder.targetUserId);
        notification.setTaskName(builder.taskName);
        notification.setCompletionAction(builder.completionAction);
        notification.setThreadReplyCount(builder.threadReplyCount);

        Notification savedNotification = notificationRepository.save(notification);
        sendUpsertAfterCommit(user.getId(), notificationMapper.mapToDto(savedNotification));
        return savedNotification;
    }

    private void createOncePerTask(
            User user,
            NotificationType type,
            Task task,
            String title,
            String text,
            java.util.function.Consumer<NotificationBuilder> customizer
    ) {
        if (notificationRepository.findFirstByUserAndTypeAndTaskIdAndExpiresAtAfter(user, type, task.getId(), now()).isPresent()) {
            return;
        }
        create(user, type, title, text, customizer);
    }

    private boolean isAllowedBySettings(User user, NotificationType type) {
        NotificationSettings settings = user.getNotificationSettings();
        if (settings == null) {
            return true;
        }

        return switch (type) {
            case THREAD_REPLY -> Boolean.TRUE.equals(settings.getNewComments());
            case ACHIEVEMENT_RECEIVED -> Boolean.TRUE.equals(settings.getAchievements());
            case TASK_ASSIGNED, REVIEW_AVAILABLE, REVIEW_APPROVED_BY_ALL, REVIEW_REWORK_REQUIRED,
                 REVIEW_EXPIRED_WITHOUT_DECISION, AI_REVIEW_COMPLETED, TASK_COMPLETED_REVIEWER,
                 TASK_COMPLETED_OWNER -> Boolean.TRUE.equals(settings.getReviewAssignments());
            default -> true;
        };
    }

    private void completeJoinRequestNotifications(Organization organization, User requester) {
        List<Notification> notifications = new ArrayList<>();
        for (UserOrganization member : organization.getMembers()) {
            if (Boolean.TRUE.equals(member.getAdmin())) {
                notifications.addAll(notificationRepository
                        .findByUserAndCompletionActionAndExpiresAtAfter(
                                member.getUser(),
                                NotificationCompletionAction.RESOLVE_ORGANIZATION_JOIN_REQUEST,
                                now()
                        )
                        .stream()
                        .filter(notification -> Objects.equals(notification.getOrganizationId(), organization.getId()))
                        .filter(notification -> Objects.equals(notification.getTargetUserId(), requester.getId()))
                        .toList());
            }
        }
        deleteAll(notifications);
    }

    private void deleteActiveByCompletion(Task task, NotificationCompletionAction action) {
        List<Notification> notifications = task.getUsers().stream()
                .map(UserTask::getUser)
                .flatMap(user -> notificationRepository.findByUserAndCompletionActionAndExpiresAtAfter(user, action, now()).stream())
                .filter(notification -> Objects.equals(notification.getTaskId(), task.getId()))
                .toList();
        deleteAll(notifications);
    }

    private void deleteActiveByCompletion(Review review, NotificationCompletionAction action) {
        List<Notification> notifications = notificationRepository
                .findByUserAndCompletionActionAndExpiresAtAfter(review.getUser(), action, now())
                .stream()
                .filter(notification -> Objects.equals(notification.getReviewId(), review.getId()))
                .toList();
        deleteAll(notifications);
    }

    private List<String> deleteAll(List<Notification> notifications) {
        List<String> deletedIds = new ArrayList<>();
        for (Notification notification : notifications) {
            String id = String.valueOf(notification.getId());
            Long userId = notification.getUser().getId();
            notificationRepository.delete(notification);
            deletedIds.add(id);
            sendDeletedAfterCommit(userId, id);
        }
        return deletedIds;
    }

    private boolean isAllReviewsApproved(Task task) {
        if (task.getReviews().isEmpty()) {
            return false;
        }

        return task.getReviews().stream().allMatch(review -> {
            ReviewIteration iteration = review.getLastIteration();
            return iteration != null
                    && iteration.getReviewVerdict() != null
                    && ReviewVerdictType.APPROVED.equals(iteration.getReviewVerdict().getVerdict())
                    && iteration.getCompletedAt() != null
                    && !iteration.getCompletedAt().isAfter(iteration.getDeadline());
        });
    }

    private void applyThreadReplyDestination(
            Notification notification,
            boolean recipientIsAssignee,
            Task task,
            Review review
    ) {
        notification.setProjectId(task.getProject().getId());
        notification.setTaskId(task.getId());
        notification.setTaskName(task.getTitle());
        if (recipientIsAssignee) {
            notification.setTargetKind(NotificationTargetKind.TASK);
            notification.setReviewId(null);
            notification.setCompletionAction(NotificationCompletionAction.OPEN_TASK);
            return;
        }

        notification.setTargetKind(NotificationTargetKind.REVIEW);
        notification.setReviewId(review.getId());
        notification.setCompletionAction(NotificationCompletionAction.OPEN_REVIEW);
    }

    private boolean matchesTarget(Notification notification, NotificationTargetDto target) {
        if (target == null) {
            return false;
        }

        NotificationTargetKind targetKind = parseKind(target.kind());
        return notification.getTargetKind() == targetKind
                && matchesId(notification.getOrganizationId(), target.organizationId())
                && matchesId(notification.getProjectId(), target.projectId())
                && matchesId(notification.getTaskId(), target.taskId())
                && matchesId(notification.getReviewId(), target.reviewId())
                && matchesId(notification.getTargetUserId(), target.userId());
    }

    private boolean matchesId(Long notificationValue, Long requestedValue) {
        return requestedValue == null || Objects.equals(notificationValue, requestedValue);
    }

    private NotificationCompletionAction parseAction(String action) {
        return NotificationCompletionAction.valueOf(action);
    }

    private NotificationTargetKind parseKind(String kind) {
        return NotificationTargetKind.valueOf(kind.toUpperCase(Locale.ROOT));
    }

    private LocalDateTime minDate(LocalDateTime left, LocalDateTime right) {
        if (right == null) {
            return left;
        }
        return left.isBefore(right) ? left : right;
    }

    private String formatDeadline(LocalDateTime deadline) {
        if (deadline == null) {
            return "не указан";
        }
        return deadline.format(DEADLINE_FORMATTER);
    }

    private long defaultTtlDays(NotificationType type) {
        return switch (type) {
            case ORGANIZATION_JOIN_APPROVED, ORGANIZATION_JOIN_REJECTED, REVIEW_REWORK_REQUIRED,
                 REVIEW_EXPIRED_WITHOUT_DECISION, AI_REVIEW_COMPLETED, THREAD_REPLY, TASK_COMPLETED_OWNER -> 3;
            case ORGANIZATION_JOIN_REQUEST, ACHIEVEMENT_RECEIVED -> 5;
            case REVIEW_APPROVED_BY_ALL, TASK_COMPLETED_REVIEWER -> 7;
            case TASK_ASSIGNED, REVIEW_AVAILABLE -> 10;
        };
    }

    private LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    private void sendUpsertAfterCommit(Long userId, NotificationDto notification) {
        afterCommit(() -> notificationRealtimeService.sendUpsert(userId, notification));
    }

    private void sendDeletedAfterCommit(Long userId, String notificationId) {
        afterCommit(() -> notificationRealtimeService.sendDeleted(userId, notificationId));
    }

    private void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private static class NotificationBuilder {
        private final LocalDateTime currentTime;
        private LocalDateTime expiresAt;
        private LocalDateTime deadline;
        private NotificationTargetKind targetKind;
        private Long organizationId;
        private Long projectId;
        private Long taskId;
        private Long reviewId;
        private Long targetUserId;
        private String taskName;
        private NotificationCompletionAction completionAction;
        private Integer threadReplyCount;

        private NotificationBuilder(LocalDateTime currentTime) {
            this.currentTime = currentTime;
        }

        private void organizationTarget(Organization organization) {
            targetKind = NotificationTargetKind.ORGANIZATION;
            organizationId = organization.getId();
        }

        private void taskTarget(Task task) {
            targetKind = NotificationTargetKind.TASK;
            projectId = task.getProject().getId();
            taskId = task.getId();
            taskName = task.getTitle();
        }

        private void reviewTarget(Review review) {
            targetKind = NotificationTargetKind.REVIEW;
            projectId = review.getTask().getProject().getId();
            taskId = review.getTask().getId();
            reviewId = review.getId();
            taskName = review.getTask().getTitle();
        }

        private void leaderboardTarget() {
            targetKind = NotificationTargetKind.LEADERBOARD;
        }

        private void profileTarget() {
            targetKind = NotificationTargetKind.PROFILE;
        }

        private void expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt == null ? currentTime : expiresAt;
        }

        private void deadline(LocalDateTime deadline) {
            this.deadline = deadline;
        }

        private void completionAction(NotificationCompletionAction completionAction) {
            this.completionAction = completionAction;
        }

        private void targetUserId(Long targetUserId) {
            this.targetUserId = targetUserId;
        }

        private void taskId(Long taskId) {
            this.taskId = taskId;
        }

        private void taskName(String taskName) {
            this.taskName = taskName;
        }

        private void threadReplyCount(Integer threadReplyCount) {
            this.threadReplyCount = threadReplyCount;
        }
    }
}

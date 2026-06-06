package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.leaderboard.LeaderBoardResponse;
import ru.urfu.backend.dto.leaderboard.LeaderboardCategory;
import ru.urfu.backend.dto.leaderboard.LeaderboardEntryDto;
import ru.urfu.backend.dto.leaderboard.LeaderboardMetricsDto;
import ru.urfu.backend.dto.leaderboard.LeaderboardPeriod;
import ru.urfu.backend.dto.leaderboard.LeaderboardResetRatingResponse;
import ru.urfu.backend.exception.customEx.ForbiddenOrganizationException;
import ru.urfu.backend.exception.customEx.ForbiddenProjectException;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.CommentReaction;
import ru.urfu.backend.model.AiReviewEvaluation;
import ru.urfu.backend.model.AiSolutionEvaluation;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.ReviewIteration;
import ru.urfu.backend.model.ReviewVerdict;
import ru.urfu.backend.model.Solution;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.model.enums.ReactionType;
import ru.urfu.backend.model.enums.AiEvaluationStatus;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.Role;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.model.enums.UserTaskType;
import ru.urfu.backend.model.enums.ReviewVerdictType;
import ru.urfu.backend.repository.UserRepository;
import ru.urfu.backend.service.AdminEventService;
import ru.urfu.backend.service.LeaderboardService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.UserService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class LeaderboardServiceImpl implements LeaderboardService {

    private static final int REVIEW_DEPTH_TARGET_LENGTH = 150;

    private final UserRepository userRepository;
    private final UserService userService;
    private final OrganizationService organizationService;
    private final ProjectService projectService;
    private final AdminEventService adminEventService;

    @Autowired
    public LeaderboardServiceImpl(
            UserRepository userRepository,
            UserService userService,
            OrganizationService organizationService,
            ProjectService projectService,
            AdminEventService adminEventService
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.organizationService = organizationService;
        this.projectService = projectService;
        this.adminEventService = adminEventService;
    }

    @Transactional(readOnly = true)
    @Override
    public LeaderBoardResponse getGlobalLeaderboard(
            User viewer,
            LeaderboardPeriod period,
            LeaderboardCategory category,
            String query,
            int page,
            int size
    ) {
        return buildLeaderboard(
                viewer,
                userRepository.findAll(),
                period,
                category,
                query,
                page,
                size,
                task -> true
        );
    }

    @Transactional(readOnly = true)
    @Override
    public LeaderBoardResponse getOrganizationLeaderboard(
            User viewer,
            Long organizationId,
            LeaderboardPeriod period,
            LeaderboardCategory category,
            String query,
            int page,
            int size
    ) {
        Organization organization = organizationService.getById(organizationId);
        if (!Role.ADMIN.equals(viewer.getRole())
                && !organizationService.isUserExistsInOrganization(organization, viewer)) {
            throw new ForbiddenOrganizationException("FORBIDDEN_ORGANIZATION_LEADERBOARD");
        }

        List<User> users = organization.getMembers().stream()
                .filter(member -> Boolean.TRUE.equals(member.getEnabled()))
                .map(UserOrganization::getUser)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        return buildLeaderboard(
                viewer,
                users,
                period,
                category,
                query,
                page,
                size,
                task -> task.getProject() != null
                        && Objects.equals(organization.getId(), task.getProject().getOrganization() == null
                        ? null
                        : task.getProject().getOrganization().getId())
        );
    }

    @Transactional(readOnly = true)
    @Override
    public LeaderBoardResponse getProjectLeaderboard(
            User viewer,
            Long projectId,
            LeaderboardPeriod period,
            LeaderboardCategory category,
            String query,
            int page,
            int size
    ) {
        Project project = projectService.getById(projectId);
        if (!Role.ADMIN.equals(viewer.getRole()) && !projectService.isUserProjectExists(project, viewer)) {
            throw new ForbiddenProjectException("FORBIDDEN_PROJECT_LEADERBOARD");
        }

        List<User> users = project.getUsers().stream()
                .map(userProject -> userProject.getUser())
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        return buildLeaderboard(
                viewer,
                users,
                period,
                category,
                query,
                page,
                size,
                task -> task.getProject() != null
                        && Objects.equals(project.getId(), task.getProject().getId())
        );
    }

    @Transactional
    @Override
    public LeaderboardResetRatingResponse resetRating(User admin, Long userId, String reason) throws UserNotFoundException {
        if (!Role.ADMIN.equals(admin.getRole())) {
            throw new ForbiddenProjectException("FORBIDDEN_LEADERBOARD_RATING_RESET");
        }

        User targetUser = userService.getById(userId);
        LocalDateTime resetAt = adminEventService.logLeaderboardRatingReset(admin, targetUser, reason);
        return new LeaderboardResetRatingResponse(userId, true, resetAt.toString());
    }

    @Transactional(readOnly = true)
    @Override
    public LeaderboardMetricsDto getUserGlobalMetrics(User user) {
        User managedUser = userRepository.findById(user.getId()).orElse(user);
        return calculateStats(managedUser, LeaderboardPeriod.ALL_TIME, task -> true).metrics();
    }

    @Transactional(readOnly = true)
    @Override
    public int getFirstTryAcceptedSolutionsPercent(User user) {
        User managedUser = userRepository.findById(user.getId()).orElse(user);
        List<Task> completedSolutionTasks = managedUser.getTasks().stream()
                .filter(userTask -> UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType()))
                .map(UserTask::getTask)
                .filter(Objects::nonNull)
                .filter(task -> TaskStatus.DONE.equals(task.getStatus()))
                .filter(task -> task.getSolution() != null)
                .toList();

        if (completedSolutionTasks.isEmpty()) {
            return 0;
        }

        long firstTryAcceptedTasks = completedSolutionTasks.stream()
                .filter(this::isAcceptedOnFirstTry)
                .count();

        return (int) Math.round(firstTryAcceptedTasks * 100.0 / completedSolutionTasks.size());
    }

    private LeaderBoardResponse buildLeaderboard(
            User viewer,
            List<User> users,
            LeaderboardPeriod period,
            LeaderboardCategory category,
            String query,
            int page,
            int size,
            Predicate<Task> taskScope
    ) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.max(1, Math.min(size, 100));
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);

        List<LeaderboardEntryDto> rankedEntries = new ArrayList<>();
        List<UserLeaderboardStats> stats = users.stream()
                .distinct()
                .map(user -> calculateStats(user, period, taskScope))
                .sorted(getStatsComparator(category))
                .toList();

        for (int index = 0; index < stats.size(); index++) {
            rankedEntries.add(mapToEntry(stats.get(index), index + 1));
        }

        List<LeaderboardEntryDto> filteredEntries = rankedEntries.stream()
                .filter(entry -> normalizedQuery.isBlank()
                        || (entry.name() + " " + entry.login()).toLowerCase(Locale.ROOT).contains(normalizedQuery))
                .toList();

        int start = normalizedPage * normalizedSize;
        int end = Math.min(start + normalizedSize, filteredEntries.size());
        List<LeaderboardEntryDto> content = start >= filteredEntries.size()
                ? List.of()
                : filteredEntries.subList(start, end);

        LeaderboardEntryDto viewerEntry = rankedEntries.stream()
                .filter(entry -> entry.id() == viewer.getId())
                .findFirst()
                .orElse(null);
        boolean viewerInContent = viewerEntry != null
                && content.stream().anyMatch(entry -> entry.id() == viewerEntry.id());
        int totalPages = filteredEntries.isEmpty()
                ? 0
                : (int) Math.ceil((double) filteredEntries.size() / normalizedSize);

        return new LeaderBoardResponse(
                content,
                viewerEntry != null && !viewerInContent ? viewerEntry : null,
                normalizedPage,
                normalizedSize,
                filteredEntries.size(),
                totalPages
        );
    }

    private UserLeaderboardStats calculateStats(User user, LeaderboardPeriod period, Predicate<Task> taskScope) {
        LocalDateTime periodStart = getPeriodStart(period);
        LocalDateTime resetAt = adminEventService.getLastLeaderboardRatingResetAt(user).orElse(null);
        LocalDateTime effectiveStart = maxDate(periodStart, resetAt);

        List<Review> completedReviews = user.getReviews().stream()
                .filter(review -> ReviewStatus.COMPLETED.equals(review.getStatus()))
                .filter(review -> review.getTask() != null && taskScope.test(review.getTask()))
                .filter(review -> isInPeriod(getReviewCompletedAt(review), effectiveStart))
                .toList();

        List<UserTask> assigneeTasks = user.getTasks().stream()
                .filter(userTask -> UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType()))
                .filter(userTask -> userTask.getTask() != null && taskScope.test(userTask.getTask()))
                .toList();

        List<ReviewVerdict> solutionVerdicts = assigneeTasks.stream()
                .map(UserTask::getTask)
                .flatMap(task -> task.getReviews().stream())
                .flatMap(review -> review.getReviewIterations().stream())
                .map(ReviewIteration::getReviewVerdict)
                .filter(Objects::nonNull)
                .filter(verdict -> isInPeriod(verdict.getCreatedAt(), effectiveStart))
                .toList();

        List<ReviewVerdict> reviewerVerdicts = completedReviews.stream()
                .flatMap(review -> review.getReviewIterations().stream())
                .map(ReviewIteration::getReviewVerdict)
                .filter(Objects::nonNull)
                .filter(verdict -> isInPeriod(verdict.getCreatedAt(), effectiveStart))
                .toList();

        List<AiSolutionEvaluation> aiSolutionEvaluations = assigneeTasks.stream()
                .map(UserTask::getTask)
                .flatMap(task -> task.getReviews().stream())
                .flatMap(review -> review.getReviewIterations().stream())
                .map(ReviewIteration::getAiSolutionEvaluation)
                .filter(Objects::nonNull)
                .filter(evaluation -> AiEvaluationStatus.COMPLETED.equals(evaluation.getStatus()))
                .filter(evaluation -> isInPeriod(evaluation.getCreatedAt(), effectiveStart))
                .toList();

        List<AiReviewEvaluation> aiReviewEvaluations = completedReviews.stream()
                .flatMap(review -> review.getReviewIterations().stream())
                .map(ReviewIteration::getAiReviewEvaluation)
                .filter(Objects::nonNull)
                .filter(evaluation -> AiEvaluationStatus.COMPLETED.equals(evaluation.getStatus()))
                .filter(evaluation -> isInPeriod(evaluation.getCreatedAt(), effectiveStart))
                .toList();

        List<Comment> topLevelSolutionComments = assigneeTasks.stream()
                .map(UserTask::getTask)
                .flatMap(task -> task.getReviews().stream())
                .flatMap(review -> review.getReviewIterations().stream())
                .flatMap(iteration -> iteration.getComments().stream())
                .filter(comment -> comment.getParentComment() == null)
                .filter(comment -> isInPeriod(comment.getCreatedAt(), effectiveStart))
                .toList();

        List<Comment> reviewerComments = user.getComments().stream()
                .filter(comment -> comment.getParentComment() == null)
                .filter(comment -> comment.getReviewIteration() != null)
                .filter(comment -> comment.getReviewIteration().getReview() != null)
                .filter(comment -> comment.getReviewIteration().getReview().getTask() != null)
                .filter(comment -> taskScope.test(comment.getReviewIteration().getReview().getTask()))
                .filter(comment -> isInPeriod(comment.getCreatedAt(), effectiveStart))
                .toList();

        double codeQuality = averageScore(solutionVerdicts);
        double aiCodeQuality = averageAiSolutionScore(aiSolutionEvaluations);
        double aiReviewQuality = averageAiReviewScore(aiReviewEvaluations);
        int likesCount = countLikes(reviewerComments);
        int completedReviewsCount = completedReviews.size();
        int completedTasksCount = (int) assigneeTasks.stream()
                .map(UserTask::getTask)
                .filter(task -> TaskStatus.DONE.equals(task.getStatus()))
                .filter(task -> isInPeriod(task.getCompletedAt(), effectiveStart))
                .count();
        int fixedCommentsPercent = calculateFixedCommentsPercent(topLevelSolutionComments);
        int reviewDepthPercent = calculateReviewDepthPercent(reviewerVerdicts);
        double totalRating = calculateTotalRating(
                assigneeTasks,
                completedReviews,
                solutionVerdicts,
                reviewerVerdicts,
                likesCount,
                user,
                effectiveStart
        );

        return new UserLeaderboardStats(
                user,
                new LeaderboardMetricsDto(
                        round(totalRating),
                        round(codeQuality),
                        nullableRounded(aiCodeQuality),
                        fixedCommentsPercent,
                        nullableRounded(aiReviewQuality),
                        likesCount,
                        reviewDepthPercent,
                        completedReviewsCount,
                        completedTasksCount
                )
        );
    }

    private double calculateTotalRating(
            List<UserTask> assigneeTasks,
            List<Review> completedReviews,
            List<ReviewVerdict> solutionVerdicts,
            List<ReviewVerdict> reviewerVerdicts,
            int likesCount,
            User user,
            LocalDateTime effectiveStart
    ) {
        int submittedSolutions = (int) assigneeTasks.stream()
                .map(UserTask::getTask)
                .map(Task::getSolution)
                .filter(Objects::nonNull)
                .map(Solution::getUploadedAt)
                .filter(uploadedAt -> isInPeriod(uploadedAt, effectiveStart))
                .count();

        int fastReviews = (int) completedReviews.stream()
                .filter(this::isCompletedWithin24Hours)
                .count();

        int solutionQualityPoints = solutionVerdicts.stream()
                .filter(verdict -> verdict.getReviewIteration() != null)
                .filter(verdict -> verdict.getReviewIteration().getReview() != null)
                .filter(verdict -> verdict.getReviewIteration().getReview().getTask() != null)
                .filter(verdict -> verdict.getOverallScore() != null)
                .collect(Collectors.groupingBy(
                        verdict -> verdict.getReviewIteration().getReview().getTask(),
                        Collectors.averagingInt(ReviewVerdict::getOverallScore)
                ))
                .values()
                .stream()
                .mapToInt(this::getQualityPoints)
                .sum();

        int reviewQualityPoints = reviewerVerdicts.stream()
                .map(ReviewVerdict::getOverallScore)
                .filter(Objects::nonNull)
                .mapToInt(this::getQualityPoints)
                .sum();

        LocalDateTime penaltyStart = effectiveStart == null
                ? LocalDateTime.of(1970, 1, 1, 0, 0)
                : effectiveStart;
        int penaltyPoints = adminEventService.sumPenaltyPointsSince(user, penaltyStart);

        return submittedSolutions * 10.0
                + completedReviews.size() * 10.0
                + likesCount * 5.0
                + fastReviews * 10.0
                + solutionQualityPoints
                + reviewQualityPoints
                + penaltyPoints;
    }

    private LeaderboardEntryDto mapToEntry(UserLeaderboardStats stats, int rank) {
        User user = stats.user();
        return new LeaderboardEntryDto(
                user.getId(),
                rank,
                user.getFullName(),
                user.getLogin(),
                user.getAvatarFileTitle(),
                stats.metrics()
        );
    }

    private Comparator<UserLeaderboardStats> getStatsComparator(LeaderboardCategory category) {
        return Comparator
                .comparingDouble((UserLeaderboardStats stats) -> getSortValue(stats.metrics(), category))
                .reversed()
                .thenComparing(stats -> stats.user().getId());
    }

    private double getSortValue(LeaderboardMetricsDto metrics, LeaderboardCategory category) {
        return switch (category) {
            case SOLUTIONS -> metrics.codeQuality();
            case REVIEWS -> metrics.aiReviewQuality() == null ? 0 : metrics.aiReviewQuality();
            case OVERALL, ACTIVITY -> metrics.totalRating();
        };
    }

    private int countLikes(List<Comment> comments) {
        return (int) comments.stream()
                .flatMap(comment -> comment.getReactions().stream())
                .map(CommentReaction::getReaction)
                .filter(ReactionType.LIKE::equals)
                .count();
    }

    private int calculateFixedCommentsPercent(List<Comment> comments) {
        if (comments.isEmpty()) {
            return 0;
        }

        long fixedComments = comments.stream()
                .filter(comment -> comment.getClosedAt() != null)
                .count();
        return (int) Math.round(fixedComments * 100.0 / comments.size());
    }

    private int calculateReviewDepthPercent(List<ReviewVerdict> verdicts) {
        List<String> comments = verdicts.stream()
                .map(ReviewVerdict::getComment)
                .filter(comment -> comment != null && !comment.isBlank())
                .toList();
        if (comments.isEmpty()) {
            return 0;
        }

        double average = comments.stream()
                .mapToDouble(comment -> Math.min(100.0, comment.length() * 100.0 / REVIEW_DEPTH_TARGET_LENGTH))
                .average()
                .orElse(0);
        return (int) Math.round(average);
    }

    private double averageScore(List<ReviewVerdict> verdicts) {
        return verdicts.stream()
                .map(ReviewVerdict::getOverallScore)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);
    }

    private double averageAiSolutionScore(List<AiSolutionEvaluation> evaluations) {
        return evaluations.stream()
                .map(AiSolutionEvaluation::getQualityScore)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);
    }

    private double averageAiReviewScore(List<AiReviewEvaluation> evaluations) {
        return evaluations.stream()
                .map(AiReviewEvaluation::getQualityScore)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);
    }

    private boolean isAcceptedOnFirstTry(Task task) {
        List<ReviewVerdict> firstIterationVerdicts = task.getReviews().stream()
                .flatMap(review -> review.getReviewIterations().stream())
                .filter(iteration -> Integer.valueOf(1).equals(iteration.getIterationNumber()))
                .map(ReviewIteration::getReviewVerdict)
                .filter(Objects::nonNull)
                .toList();

        return !firstIterationVerdicts.isEmpty()
                && firstIterationVerdicts.stream()
                .noneMatch(verdict -> ReviewVerdictType.REWORK.equals(verdict.getVerdict()))
                && firstIterationVerdicts.stream()
                .anyMatch(verdict -> ReviewVerdictType.APPROVED.equals(verdict.getVerdict()));
    }

    private int getQualityPoints(double score) {
        if (score >= 4.9) {
            return 30;
        }
        if (score >= 4.5) {
            return 20;
        }
        if (score >= 4.0) {
            return 10;
        }
        if (score >= 2.1) {
            return -10;
        }
        if (score >= 1) {
            return -30;
        }
        return 0;
    }

    private boolean isCompletedWithin24Hours(Review review) {
        ReviewIteration iteration = review.getLastIteration();
        if (iteration == null || iteration.getUploadedAt() == null || iteration.getCompletedAt() == null) {
            return false;
        }

        return Duration.between(iteration.getUploadedAt(), iteration.getCompletedAt()).toHours() <= 24;
    }

    private LocalDateTime getReviewCompletedAt(Review review) {
        ReviewIteration iteration = review.getLastIteration();
        return iteration == null ? null : iteration.getCompletedAt();
    }

    private LocalDateTime getPeriodStart(LeaderboardPeriod period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period) {
            case DAYS_7 -> now.minusDays(7);
            case DAYS_30 -> now.minusDays(30);
            case ALL_TIME -> null;
        };
    }

    private LocalDateTime maxDate(LocalDateTime left, LocalDateTime right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left.isAfter(right) ? left : right;
    }

    private boolean isInPeriod(LocalDateTime value, LocalDateTime start) {
        return value != null && (start == null || !value.isBefore(start));
    }

    private double round(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private Double nullableRounded(double value) {
        if (value <= 0) {
            return null;
        }
        return round(value);
    }

    private record UserLeaderboardStats(User user, LeaderboardMetricsDto metrics) {
    }
}

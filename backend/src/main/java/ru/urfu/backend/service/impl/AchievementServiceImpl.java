package ru.urfu.backend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.achievement.AchievementDto;
import ru.urfu.backend.dto.leaderboard.LeaderboardMetricsDto;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.ReviewIteration;
import ru.urfu.backend.model.ReviewVerdict;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.model.enums.UserTaskType;
import ru.urfu.backend.service.AchievementService;
import ru.urfu.backend.service.LeaderboardService;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;

@Service
public class AchievementServiceImpl implements AchievementService {

    private static final List<AchievementDto> ACHIEVEMENTS = List.of(
            new AchievementDto(1L, "achievement-nachalo-nachal-icon.svg", "Начало начал", "Сдать первую задачу", true),
            new AchievementDto(2L, "achievement-pervaya-krov-icon.svg", "Первая кровь", "Отправить первое ревью", true),
            new AchievementDto(3L, "achievement-da-ty-senior-icon.svg", "Да ты Сеньор", "Отправить на ревью 50 задач", true),
            new AchievementDto(4L, "achievement-legenda-revyu-icon.svg", "Легенда ревью", "Завершить 100 ревью", true),
            new AchievementDto(5L, "achievement-vlyublyon-v-II-icon.svg", "Влюблён в ИИ", "Завершить 10 задач только с AI-проверкой", true),
            new AchievementDto(6L, "achievement-pochti-yandex-icon.svg", "Почти Яндекс", "Создать 10 проектов в одной организации", true),
            new AchievementDto(7L, "achievement-son-dlya-slabykh-icon.svg", "Сон для слабых", "Закрыть задачу в промежутке 00:00-06:00", true),
            new AchievementDto(8L, "achievement-bespodobny-icon.svg", "Бесподобный", "Получить суммарную оценку 5 от всех ревьюверов", true),
            new AchievementDto(9L, "achievement-vosstanie-mashinn-icon.svg", "Восстание машин", "Получить от AI-ревьювера оценку 1 балл по любому критерию", true),
            new AchievementDto(10L, "achievement-zhestokiy-mir-icon.svg", "Жестокий мир", "Получить среднюю оценку ревью ниже 3", false),
            new AchievementDto(11L, "achievement-nelzya-sdat-icon.svg", "Нельзя сдать пятьсот миллионов задач, не получив ни одного плохого отзыва", "Получить оценку 1 или 2 за любой критерий", false),
            new AchievementDto(12L, "achievement-krik-tishiny-icon.svg", "Крик тишины", "Отправить ревью без inline-комментария", false),
            new AchievementDto(13L, "achievement-delo-hrabryh-icon.svg", "Дело храбрых", "Отправить жалобу на ревью", false),
            new AchievementDto(14L, "achievement-opytnyy-yuzer-icon.svg", "Опытный юзер", "Набрать 500 баллов", true),
            new AchievementDto(15L, "achievement-pora-by-v-otpusk-icon.svg", "Пора бы в отпуск…", "Набрать 5000 баллов", true),
            new AchievementDto(16L, "achievement-skolko-skolko-icon.svg", "Сколько? Сколько?", "Набрать 10000 баллов", true),
            new AchievementDto(17L, "achievement-nelovko-vyshlo-icon.svg", "Неловко вышло…", "Получить отрицательное количество баллов", false),
            new AchievementDto(18L, "achievement-zvuk-svobody-icon.svg", "Звук свободы", "Не сдать задачу вовремя", false)
    );

    private final LeaderboardService leaderboardService;

    public AchievementServiceImpl(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<AchievementDto> getAchievements(User user, boolean includeHidden) {
        Set<Long> receivedAchievementIds = Set.copyOf(getReceivedAchievementIds(user));
        return ACHIEVEMENTS.stream()
                .filter(achievement -> includeHidden
                        || receivedAchievementIds.contains(achievement.id()))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<Long> getReceivedAchievementIds(User user) {
        AchievementStats stats = collectStats(user);

        return ACHIEVEMENTS.stream()
                .filter(achievement -> isReceived(achievement.id(), stats))
                .map(AchievementDto::id)
                .toList();
    }

    private AchievementStats collectStats(User user) {
        List<Task> assigneeTasks = user.getTasks().stream()
                .filter(userTask -> UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType()))
                .map(UserTask::getTask)
                .filter(Objects::nonNull)
                .toList();
        List<Review> completedReviews = user.getReviews().stream()
                .filter(review -> ReviewStatus.COMPLETED.equals(review.getStatus()))
                .toList();
        List<ReviewVerdict> solutionVerdicts = assigneeTasks.stream()
                .flatMap(task -> task.getReviews().stream())
                .flatMap(review -> review.getReviewIterations().stream())
                .map(ReviewIteration::getReviewVerdict)
                .filter(Objects::nonNull)
                .toList();
        List<ReviewVerdict> reviewerVerdicts = completedReviews.stream()
                .flatMap(review -> review.getReviewIterations().stream())
                .map(ReviewIteration::getReviewVerdict)
                .filter(Objects::nonNull)
                .toList();
        LeaderboardMetricsDto metrics = leaderboardService.getUserGlobalMetrics(user);

        return new AchievementStats(
                assigneeTasks,
                user.getProjects().stream().toList(),
                user.getCommentReports().stream().anyMatch(report -> Boolean.TRUE.equals(report.getActive())),
                completedReviews,
                solutionVerdicts,
                reviewerVerdicts,
                metrics.totalRating()
        );
    }

    private boolean isReceived(Long achievementId, AchievementStats stats) {
        return switch (achievementId.intValue()) {
            case 1 -> stats.completedTasksCount() >= 1;
            case 2 -> stats.completedReviews().size() >= 1;
            case 3 -> stats.submittedSolutionsCount() >= 50;
            case 4 -> stats.completedReviews().size() >= 100;
            case 5 -> stats.completedAiOnlyTasksCount() >= 10;
            case 6 -> hasTenOwnedProjectsInOneOrganization(stats.userProjects());
            case 7 -> stats.assigneeTasks().stream().anyMatch(this::isCompletedAtNight);
            case 8 -> stats.assigneeTasks().stream().anyMatch(this::hasPerfectAverageScore);
            case 9 -> stats.solutionVerdicts().stream().anyMatch(this::hasAiReviewOnePointCriterion);
            case 10 -> averageScore(stats.solutionVerdicts()) > 0 && averageScore(stats.solutionVerdicts()) < 3;
            case 11 -> stats.solutionVerdicts().stream().anyMatch(this::hasBadCriterion);
            case 12 -> stats.completedReviews().stream().anyMatch(this::isReviewWithoutInlineComment);
            case 13 -> stats.hasCommentReports();
            case 14 -> stats.totalRating() >= 500;
            case 15 -> stats.totalRating() >= 5000;
            case 16 -> stats.totalRating() >= 10000;
            case 17 -> stats.totalRating() < 0;
            case 18 -> stats.assigneeTasks().stream().anyMatch(this::isOverdue);
            default -> false;
        };
    }

    private boolean hasTenOwnedProjectsInOneOrganization(List<UserProject> userProjects) {
        Map<Long, Long> ownedProjectsByOrganization = userProjects.stream()
                .filter(userProject -> ProjectMemberRole.OWNER.equals(userProject.getProjectMemberRole()))
                .map(UserProject::getProject)
                .filter(Objects::nonNull)
                .distinct()
                .filter(project -> project.getOrganization() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        project -> project.getOrganization().getId(),
                        java.util.stream.Collectors.counting()
                ));

        return ownedProjectsByOrganization.values().stream().anyMatch(count -> count >= 10);
    }

    private boolean isCompletedAtNight(Task task) {
        LocalDateTime completedAt = task.getCompletedAt();
        if (completedAt == null) {
            return false;
        }
        int hour = completedAt.getHour();
        return hour >= 0 && hour < 6;
    }

    private boolean hasPerfectAverageScore(Task task) {
        List<ReviewVerdict> verdicts = task.getReviews().stream()
                .flatMap(review -> review.getReviewIterations().stream())
                .map(ReviewIteration::getReviewVerdict)
                .filter(Objects::nonNull)
                .filter(verdict -> verdict.getOverallScore() != null)
                .toList();
        return !verdicts.isEmpty() && averageScore(verdicts) == 5;
    }

    private boolean hasAiReviewOnePointCriterion(ReviewVerdict verdict) {
        ReviewIteration iteration = verdict.getReviewIteration();
        Review review = iteration == null ? null : iteration.getReview();
        Task task = review == null ? null : review.getTask();
        return task != null
                && (ReviewType.AI_ONLY.equals(task.getReviewType())
                || Boolean.TRUE.equals(task.getAiReviewEnabledAtCreation()))
                && hasCriterion(verdict, score -> score == 1);
    }

    private boolean hasBadCriterion(ReviewVerdict verdict) {
        return hasCriterion(verdict, score -> score == 1 || score == 2);
    }

    private boolean hasCriterion(ReviewVerdict verdict, Predicate<Integer> predicate) {
        return List.of(
                        verdict.getArchitecture(),
                        verdict.getReadability(),
                        verdict.getTestability(),
                        verdict.getScalability(),
                        verdict.getOverallScore()
                ).stream()
                .filter(Objects::nonNull)
                .anyMatch(predicate);
    }

    private boolean isReviewWithoutInlineComment(Review review) {
        return review.getReviewIterations().stream()
                .filter(iteration -> iteration.getReviewVerdict() != null)
                .max(Comparator.comparing(ReviewIteration::getIterationNumber))
                .map(iteration -> iteration.getComments().stream().noneMatch(this::isInlineTopLevelComment))
                .orElse(false);
    }

    private boolean isInlineTopLevelComment(Comment comment) {
        return comment.getParentComment() == null && comment.getFile() != null && !comment.getFile().isBlank();
    }

    private boolean isOverdue(Task task) {
        LocalDateTime deadline = task.getDeadline();
        if (deadline == null) {
            return false;
        }
        LocalDateTime completedAt = task.getCompletedAt();
        if (completedAt != null) {
            return completedAt.isAfter(deadline);
        }
        return !TaskStatus.DONE.equals(task.getStatus()) && deadline.isBefore(LocalDateTime.now());
    }

    private double averageScore(List<ReviewVerdict> verdicts) {
        return verdicts.stream()
                .map(ReviewVerdict::getOverallScore)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);
    }

    private record AchievementStats(
            List<Task> assigneeTasks,
            List<UserProject> userProjects,
            boolean hasCommentReports,
            List<Review> completedReviews,
            List<ReviewVerdict> solutionVerdicts,
            List<ReviewVerdict> reviewerVerdicts,
            double totalRating
    ) {

        private int submittedSolutionsCount() {
            return (int) assigneeTasks.stream()
                    .filter(task -> task.getSolution() != null)
                    .count();
        }

        private int completedTasksCount() {
            return (int) assigneeTasks.stream()
                    .filter(task -> TaskStatus.DONE.equals(task.getStatus()))
                    .count();
        }

        private int completedAiOnlyTasksCount() {
            return (int) assigneeTasks.stream()
                    .filter(task -> TaskStatus.DONE.equals(task.getStatus()))
                    .filter(task -> ReviewType.AI_ONLY.equals(task.getReviewType())
                            || Boolean.TRUE.equals(task.getAiReviewEnabledAtCreation()))
                    .count();
        }

    }
}

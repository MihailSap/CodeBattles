package ru.urfu.backend.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.review.*;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.AiEvaluationStatus;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.UserTaskType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class ReviewMapper {

    private final CommentMapper commentMapper;

    @Autowired
    public ReviewMapper(CommentMapper commentMapper) {
        this.commentMapper = commentMapper;
    }

    public SubmitFinalReviewResponse mapToSubmitFinalReviewResponse(Review review){
        return new SubmitFinalReviewResponse(
                review.getId(),
                review.getStatus(),
                review.getTask().getStatus(),
                mapToFinalReviewResponse(review.getLastIteration())
        );
    }

    public List<ReviewListItemDto> mapToReviewListItemDto(List<Review> reviews) {
        List<ReviewListItemDto> reviewListItemDtos = new ArrayList<>();
        for (Review review : reviews) {
            reviewListItemDtos.add(mapToReviewListItemDto(review));
        }
        return reviewListItemDtos;
    }

    public ReviewDetailsResponse mapToReviewDetailsResponseByTask(
            Review review,
            PermissionsResponse permissionsResponse
    ) {
        Task task = review.getTask();
        Set<ReviewIteration> currentIterations = new HashSet<>();
        Set<ReviewIteration> historyIterations = new HashSet<>();
        Set<Comment> currentComments = new HashSet<>();
        for (Review taskReview : task.getReviews()) {
            ReviewIteration currentIteration = taskReview.getLastIteration();
            if (currentIteration != null) {
                currentIterations.add(currentIteration);
                currentComments.addAll(currentIteration.getComments());
            }
            for (ReviewIteration iteration : taskReview.getReviewIterations()) {
                if (!iteration.equals(currentIteration)) {
                    historyIterations.add(iteration);
                }
            }
        }
        Project project = task.getProject();
        Organization organization = project.getOrganization();
        Solution solution = task.getSolution();
        ReviewIteration viewerIteration = review.getLastIteration();
        return new ReviewDetailsResponse(
                review.getId(),
                task.getId(),
                project.getId(),
                solution.getId(),
                mapToReviewProjectResponse(project),
                mapToReviewOrganizationResponse(organization),
                task.getTitle(),
                task.getStatus(),
                review.getStatus(),
                task.getReviewType(),
                solution.getUploadType(),
                viewerIteration.getUploadedAt() == null ? "" : viewerIteration.getUploadedAt().toString(),
                viewerIteration.getDeadline() == null ? "" : viewerIteration.getDeadline().toString(),
                viewerIteration.getCompletedAt() == null ? "" : viewerIteration.getCompletedAt().toString(),
                getVisibleUntil(viewerIteration),
                review.getRevealAuthorAfterReview(),
                solution.getRevealAuthorAfterReview(),
                mapToAssignees(task.getUsers()),
                mapToReviewers(task.getUsers()),
                mapToViewerAssignmentResponse(review),
                mapToReviewFileContentResponses(viewerIteration),
                commentMapper.mapToReviewCommentResponses(currentComments),
                mapToHistoryResponses(historyIterations),
                mapToFinalReviewResponses(currentIterations),
                mapAiSolutionEvaluation(currentIterations),
                mapAiReviewEvaluation(currentIterations),
                permissionsResponse
        );
    }

    public ReviewDetailsResponse mapToWaitingReviewDetailsResponse(
            Review review,
            PermissionsResponse permissionsResponse
    ) {
        Task task = review.getTask();
        Set<ReviewIteration> historyIterations = new HashSet<>();
        for (Review taskReview : task.getReviews()) {
            ReviewIteration currentIteration = taskReview.getLastIteration();
            for (ReviewIteration iteration : taskReview.getReviewIterations()) {
                if (!iteration.equals(currentIteration)) {
                    historyIterations.add(iteration);
                }
            }
        }
        Project project = task.getProject();
        Organization organization = project.getOrganization();
        Solution solution = task.getSolution();
        ReviewIteration currentIteration = review.getLastIteration();
        return new ReviewDetailsResponse(
                review.getId(),
                task.getId(),
                project.getId(),
                solution.getId(),
                mapToReviewProjectResponse(project),
                mapToReviewOrganizationResponse(organization),
                task.getTitle(),
                task.getStatus(),
                null,
                task.getReviewType(),
                solution.getUploadType(),
                currentIteration.getUploadedAt() == null ? "" : currentIteration.getUploadedAt().toString(),
                currentIteration.getDeadline() == null ? "" : currentIteration.getDeadline().toString(),
                "",
                getVisibleUntil(currentIteration),
                false,
                solution.getRevealAuthorAfterReview(),
                mapToAssignees(task.getUsers()),
                mapToReviewers(task.getUsers()),
                null,
                mapToReviewFileContentResponses(currentIteration),
                List.of(),
                mapToHistoryResponses(historyIterations),
                List.of(),
                null,
                null,
                permissionsResponse
        );
    }

    private List<ReviewHistoryResponse> mapToHistoryResponses(Set<ReviewIteration> historyIterations) {
        List<ReviewHistoryResponse> responses = new ArrayList<>();
        historyIterations.stream()
                .sorted((a, b) -> {
                    int iterationCompare = Integer.compare(
                            a.getIterationNumber(),
                            b.getIterationNumber()
                    );
                    if (iterationCompare != 0) {
                        return iterationCompare;
                    }
                    return Integer.compare(
                            a.getReview().getReviewerIndex(),
                            b.getReview().getReviewerIndex()
                    );
                })
                .forEach(iteration -> responses.add(mapToReviewHistoryResponse(iteration)));

        return responses;
    }

    public ReviewDetailsResponse mapToReviewDetailsResponse(Review review, PermissionsResponse permissionsResponse){
        Task task = review.getTask();
        Project project = task.getProject();
        Organization organization = project.getOrganization();
        Solution solution = task.getSolution();
        Set<UserTask> userTasks = task.getUsers();
        ReviewIteration reviewIteration = review.getLastIteration();
        return new ReviewDetailsResponse(
                review.getId(),
                task.getId(),
                project.getId(),
                solution.getId(),
                mapToReviewProjectResponse(project),
                mapToReviewOrganizationResponse(organization),
                task.getTitle(),
                task.getStatus(),
                review.getStatus(),
                task.getReviewType(),
                solution.getUploadType(),
                reviewIteration.getUploadedAt() == null ? "" : reviewIteration.getUploadedAt().toString(),
                reviewIteration.getDeadline() == null ? "" : reviewIteration.getDeadline().toString(),
                reviewIteration.getCompletedAt() == null ? "" : reviewIteration.getCompletedAt().toString(),
                getVisibleUntil(reviewIteration),
                review.getRevealAuthorAfterReview(),
                solution.getRevealAuthorAfterReview(),
                mapToAssignees(userTasks),
                mapToReviewers(userTasks),
                mapToViewerAssignmentResponse(review),
                mapToReviewFileContentResponses(reviewIteration),
                commentMapper.mapToReviewCommentResponses(reviewIteration.getComments()),
                mapToHistoryEventResponse(review),
                mapToCurrentFinalReviewResponses(review),
//                mapToFinalReviewResponses(review.getReviewIterations()),
                mapAiSolutionEvaluation(reviewIteration),
                mapAiReviewEvaluation(reviewIteration),
                permissionsResponse
        );
    }

    private AiEvaluationDto mapAiSolutionEvaluation(Set<ReviewIteration> reviewIterations) {
        return reviewIterations.stream()
                .map(this::mapAiSolutionEvaluation)
                .filter(evaluation -> evaluation != null)
                .findFirst()
                .orElse(null);
    }

    private AiReviewEvaluationDto mapAiReviewEvaluation(Set<ReviewIteration> reviewIterations) {
        return reviewIterations.stream()
                .map(this::mapAiReviewEvaluation)
                .filter(evaluation -> evaluation != null)
                .findFirst()
                .orElse(null);
    }

    private AiEvaluationDto mapAiSolutionEvaluation(ReviewIteration reviewIteration) {
        AiSolutionEvaluation evaluation = reviewIteration.getAiSolutionEvaluation();
        if (evaluation == null || AiEvaluationStatus.PENDING.equals(evaluation.getStatus())) {
            return null;
        }
        if (AiEvaluationStatus.FAILED.equals(evaluation.getStatus())) {
            return new AiEvaluationDto(
                    evaluation.getStatus().name(),
                    null,
                    null,
                    null,
                    null,
                    evaluation.getErrorMessage()
            );
        }
        return new AiEvaluationDto(
                evaluation.getStatus().name(),
                evaluation.getQualityScore(),
                evaluation.getCyclomaticComplexity(),
                new AiSolidViolationsDto(
                        evaluation.getSolidViolationsCount(),
                        evaluation.getSolidViolationsSeverity()
                ),
                evaluation.getOverallComment(),
                null
        );
    }

    private AiReviewEvaluationDto mapAiReviewEvaluation(ReviewIteration reviewIteration) {
        AiReviewEvaluation evaluation = reviewIteration.getAiReviewEvaluation();
        if (evaluation == null || AiEvaluationStatus.PENDING.equals(evaluation.getStatus())) {
            return null;
        }
        if (AiEvaluationStatus.FAILED.equals(evaluation.getStatus())) {
            return new AiReviewEvaluationDto(
                    evaluation.getStatus().name(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    evaluation.getErrorMessage()
            );
        }
        return new AiReviewEvaluationDto(
                evaluation.getStatus().name(),
                evaluation.getQualityScore(),
                evaluation.getSpecificity(),
                evaluation.getTechDepth(),
                evaluation.getCorrectness(),
                evaluation.getNonToxicity(),
                evaluation.getSummary(),
                null
        );
    }

    private List<FinalReviewResponse> mapToCurrentFinalReviewResponses(Review review) {
        List<FinalReviewResponse> responses = new ArrayList<>();
        ReviewIteration currentIteration = review.getLastIteration();
        if (currentIteration != null
                && isHumanReviewIteration(currentIteration)
                && currentIteration.getReviewVerdict() != null) {
            responses.add(mapToFinalReviewResponse(currentIteration));
        }
        return responses;
    }

    private List<ReviewHistoryResponse> mapToHistoryEventResponse(Review review){
        ReviewIteration lastReviewIteration = review.getLastIteration();
        List<ReviewHistoryResponse> historyResponses = new ArrayList<>();
        for(ReviewIteration reviewIteration : review.getReviewIterations()){
            if(reviewIteration.equals(lastReviewIteration)){
                continue;
            }
            historyResponses.add(mapToReviewHistoryResponse(reviewIteration));
        }
        return historyResponses;
    }

    private ReviewHistoryResponse mapToReviewHistoryResponse(ReviewIteration reviewIteration){
        return new ReviewHistoryResponse(
                reviewIteration.getId(),
                reviewIteration.getIterationNumber(),
                reviewIteration.getUploadedAt() == null ? null : reviewIteration.getUploadedAt().toString(),
                reviewIteration.getCompletedAt() == null ? null : reviewIteration.getCompletedAt().toString(),
                reviewIteration.getTaskStatusAfterIteration(),
                mapToReviewFileContentResponses(reviewIteration),
                commentMapper.mapToReviewCommentResponses(reviewIteration.getComments()),
                reviewIteration.getReviewVerdict() == null || !isHumanReviewIteration(reviewIteration)
                        ? null
                        : mapToFinalReviewResponse(reviewIteration)
        );
    }

    private List<FinalReviewResponse> mapToFinalReviewResponses(Set<ReviewIteration> reviewIterations) {
        List<FinalReviewResponse> responses = new ArrayList<>();
        reviewIterations.stream()
                .filter(this::isCountedIteration)
                .sorted((a, b) -> Integer.compare(
                        a.getReview().getReviewerIndex(),
                        b.getReview().getReviewerIndex()
                ))
                .forEach(iteration -> responses.add(mapToFinalReviewResponse(iteration)));
        return responses;
    }

    private boolean isCountedIteration(ReviewIteration reviewIteration) {
        return reviewIteration.getReviewVerdict() != null
                && isHumanReviewIteration(reviewIteration)
                && !Boolean.TRUE.equals(isExpired(reviewIteration));
    }

    private boolean isHumanReviewIteration(ReviewIteration reviewIteration) {
        Review review = reviewIteration.getReview();
        return review.getUser() != null
                && !ReviewType.AI_ONLY.equals(review.getTask().getReviewType());
    }

    private FinalReviewResponse mapToFinalReviewResponse(ReviewIteration reviewIteration){
        ReviewVerdict reviewVerdict = reviewIteration.getReviewVerdict();
        Review review = reviewIteration.getReview();
        User reviewer = review.getUser();
        return new FinalReviewResponse(
                review.getId(),
                reviewer == null ? null : reviewer.getId(),
                review.getReviewerIndex(),
                reviewer == null ? "AI" : reviewer.getFullName(),
                review.getRevealAuthorAfterReview(),
                review.getSolution().getRevealAuthorAfterReview(),
                reviewVerdict.getArchitecture(),
                reviewVerdict.getReadability(),
                reviewVerdict.getTestability(),
                reviewVerdict.getScalability(),
                reviewVerdict.getOverallScore(),
                reviewVerdict.getComment(),
                reviewVerdict.getVerdict(),
                reviewVerdict.getCreatedAt().toString(),
                isCheckedInTime(reviewIteration),
                isExpired(reviewIteration)
        );
    }
    
    public List<ReviewFileContentResponse> mapToReviewFileContentResponses(ReviewIteration reviewIteration){
        List<ReviewFileContentResponse> reviewFileContentResponses = new ArrayList<>();
        for(ReviewFileContent reviewFileContent : reviewIteration.getReviewFileContents()){
            reviewFileContentResponses.add(mapToReviewFileContentResponse(reviewFileContent));
        }
        return reviewFileContentResponses;
    }

    private ReviewFileContentResponse mapToReviewFileContentResponse(ReviewFileContent reviewFileContent) {
        return new ReviewFileContentResponse(
                reviewFileContent.getPath(),
                reviewFileContent.getLanguage(),
                reviewFileContent.getDiff(),
                reviewFileContent.getContent(),
                reviewFileContent.getOldContent(),
                reviewFileContent.getUnsupportedPreview()
        );
    }

    private ReviewListItemDto mapToReviewListItemDto(Review review) {
        Task task = review.getTask();
        Project project = task.getProject();
        Organization organization = project.getOrganization();
        ReviewIteration reviewIteration = review.getLastIteration();
        return new ReviewListItemDto(
                review.getId(),
                task.getId(),
                task.getTitle(),
                mapToReviewProjectResponse(project),
                mapToReviewOrganizationResponse(organization),
                reviewIteration.getUploadedAt().toString(),
                reviewIteration.getDeadline().toString(),
                review.getStatus(),
                countComments(review),
                isCheckedInTime(reviewIteration),
                isExpired(reviewIteration),
                isAllOwnThreadsResolved(reviewIteration.getComments()),
                reviewIteration.getCompletedAt() == null ? "" : reviewIteration.getCompletedAt().toString(),
                getVisibleUntil(reviewIteration)
        );
    }

    private int countComments(Review review) {
        int count = 0;
        for(Comment comment : review.getLastIteration().getComments()){
            count += countCommentTree(comment);
        }

        return count;
    }

    private int countCommentTree(Comment comment) {
        int count = 1;
        for(Comment reply : comment.getReplies()){
            count += countCommentTree(reply);
        }

        return count;
    }

    private boolean isAllOwnThreadsResolved(Set<Comment> comments){
        for(Comment comment : comments){
            if(comment.getParentComment() == null
                    && comment.getClosedAt() == null){
                return false;
            }
        }
        return true;
    }

    private ViewerAssignmentResponse mapToViewerAssignmentResponse(Review review){
        ReviewIteration reviewIteration = review.getLastIteration();
        User reviewer = review.getUser();
        return new ViewerAssignmentResponse(
                reviewer == null ? null : reviewer.getId(),
                review.getStatus(),
                countComments(review),
                reviewIteration.getReviewVerdict() != null,
                isCheckedInTime(reviewIteration),
                isExpired(reviewIteration),
                isAllOwnThreadsResolved(review.getLastIteration().getComments())
        );
    }

    private ReviewProjectResponse mapToReviewProjectResponse(Project project) {
        return new ReviewProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getIsPrivate(),
                project.getAiReviewEnabled()
        );
    }

    private ReviewOrganizationResponse mapToReviewOrganizationResponse(Organization organization) {
        if(organization == null) {
            return null;
        }
        return new ReviewOrganizationResponse(
                organization.getId(),
                organization.getTitle()
        );
    }

    private List<ReviewUserResponse> mapToAssignees(Set<UserTask> users){
        List<ReviewUserResponse> reviewUserResponses = new ArrayList<>();
        for(UserTask userTask : users){
            if(UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())){
                reviewUserResponses.add(mapToReviewUserResponse(userTask.getUser()));
            }
        }
        return reviewUserResponses;
    }

    private List<ReviewUserResponse> mapToReviewers(Set<UserTask> users){
        List<ReviewUserResponse> reviewUserResponses = new ArrayList<>();
        for(UserTask userTask : users){
            if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                reviewUserResponses.add(mapToReviewUserResponse(userTask.getUser()));
            }
        }
        return reviewUserResponses;
    }

    private ReviewUserResponse mapToReviewUserResponse(User user){
        return new ReviewUserResponse(
                user.getId(),
                user.getLogin(),
                user.getFullName(),
                user.getAvatarFileTitle()
        );
    }

    private Boolean isCheckedInTime(ReviewIteration reviewIteration){
        LocalDateTime completedAt = reviewIteration.getCompletedAt();
        if(completedAt == null){
            return null;
        }
        return completedAt.isBefore(reviewIteration.getDeadline());
    }

    private Boolean isExpired(ReviewIteration reviewIteration){
        LocalDateTime completedAt = reviewIteration.getCompletedAt();
        LocalDateTime deadline = reviewIteration.getDeadline();
        LocalDateTime now = LocalDateTime.now();
        return (completedAt == null && now.isAfter(deadline))
                || (completedAt != null && completedAt.isAfter(deadline));
    }

    private String getVisibleUntil(ReviewIteration reviewIteration){
        LocalDateTime completedAt = reviewIteration.getCompletedAt();
        LocalDateTime deadline = reviewIteration.getDeadline();
        LocalDateTime now = LocalDateTime.now();
        if(completedAt == null && now.isBefore(deadline)){
            return now.plusYears(1).toString();
        }
        if(completedAt == null && now.isAfter(deadline)){
            return deadline.plusDays(7).toString();
        }
        if(completedAt != null) {
            return completedAt.plusDays(7).toString();
        }

        return deadline.plusDays(7).toString();
    }
}

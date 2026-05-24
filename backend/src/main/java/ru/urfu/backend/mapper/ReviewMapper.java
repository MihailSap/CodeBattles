package ru.urfu.backend.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.review.*;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.UserTaskType;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
                mapToAssignees(userTasks),
                mapToReviewers(userTasks),
                mapToViewerAssignmentResponse(review),
                mapToReviewFileContentResponses(review.getLastIteration()),
                commentMapper.mapToReviewCommentResponses(reviewIteration.getComments()),
                mapToHistoryEventResponse(review),
                mapToFinalReviewResponses(review.getReviewIterations()),
                null, //TODO: Доработать, когда появится ИИ ревью
                null, //TODO: Доработать, когда появится ИИ ревью
                permissionsResponse
        );
    }

    private List<ReviewHistoryResponse> mapToHistoryEventResponse(Review review){
        List<ReviewHistoryResponse> historyResponses = new ArrayList<>();
        for(ReviewIteration reviewIteration : review.getReviewIterations()){
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
                mapToCommentDtos(reviewIteration.getComments()),
                reviewIteration.getReviewVerdict() == null ? null : mapToFinalReviewResponse(reviewIteration)
        );
    }

    private List<FinalReviewResponse> mapToFinalReviewResponses(Set<ReviewIteration> reviewIterations) {
        List<FinalReviewResponse> finalReviewResponses = new ArrayList<>();
        for(ReviewIteration reviewIteration : reviewIterations){
            if(reviewIteration.getReviewVerdict() == null){
                continue;
            }
            finalReviewResponses.add(mapToFinalReviewResponse(reviewIteration));
        }
        return finalReviewResponses;
    }

    private FinalReviewResponse mapToFinalReviewResponse(ReviewIteration reviewIteration){
        ReviewVerdict reviewVerdict = reviewIteration.getReviewVerdict();
        Review review = reviewIteration.getReview();
        User reviewer = review.getUser();
        return new FinalReviewResponse(
                review.getId(),
                reviewer.getId(),
                review.getReviewerIndex(),
                reviewer.getFullName(),
                review.getRevealAuthorAfterReview(),
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
        return new ViewerAssignmentResponse(
                review.getUser().getId(),
                review.getStatus(),
                countComments(review),
                reviewIteration.getReviewVerdict() != null,
                isCheckedInTime(reviewIteration),
                isExpired(reviewIteration),
                isAllOwnThreadsResolved(review.getLastIteration().getComments())
        );
    }

    private List<CommentResponse> mapToCommentDtos(Set<Comment> comments){
        List<CommentResponse> commentResponses = new ArrayList<>();
        for (Comment comment : comments) {
            commentResponses.add(mapToCommentDto(comment));
        }
        return commentResponses;
    }

    private CommentResponse mapToCommentDto(Comment comment){
        return new CommentResponse(
                comment.getId(),
                comment.getUser().getId(),
                comment.getUser().getFullName(),
                comment.getCreatedAt().toString(),
                comment.getText()
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

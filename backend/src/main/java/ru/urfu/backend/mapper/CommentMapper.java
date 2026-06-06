package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.comment.ReportCommentResponse;
import ru.urfu.backend.dto.comment.ReviewCommentResponse;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.CommentReaction;
import ru.urfu.backend.model.CommentReport;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ReactionType;
import ru.urfu.backend.model.enums.TaskStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Component
public class CommentMapper {

    public List<ReviewCommentResponse> mapToReviewCommentResponses(Set<Comment> comments) {
        return mapToReviewCommentResponses(comments, null);
    }

    public List<ReviewCommentResponse> mapToReviewCommentResponses(Set<Comment> comments, TaskStatus taskStatus) {
        List<ReviewCommentResponse> reviewCommentResponses = new ArrayList<>();
        boolean includeAiComments = taskStatus == null || isAiCommentsVisible(taskStatus);
        for (Comment comment : comments) {
            if (comment.getParentComment() == null) {
                ReviewCommentResponse mappedComment = mapToReviewCommentDto(comment, includeAiComments);
                if (mappedComment != null) {
                    reviewCommentResponses.add(mappedComment);
                }
            }
        }
        return reviewCommentResponses;
    }

    public ReviewCommentResponse mapToReviewCommentDto(Comment comment){
        return mapToReviewCommentDto(comment, true);
    }

    private ReviewCommentResponse mapToReviewCommentDto(Comment comment, boolean includeAiComments){
        if (!includeAiComments && CommentAuthorRole.AI.equals(comment.getCommentAuthorRole())) {
            return null;
        }

        List<Long> likedBy = new ArrayList<>();
        List<Long> dislikedBy = new ArrayList<>();
        boolean revealName = isAuthorNameVisible(comment);
        for(CommentReaction reaction : comment.getReactions()){
            if(ReactionType.LIKE.equals(reaction.getReaction())){
                likedBy.add(reaction.getUser().getId());
            } else if(ReactionType.DISLIKE.equals(reaction.getReaction())){
                dislikedBy.add(reaction.getUser().getId());
            }
        }

        return new ReviewCommentResponse(
                comment.getId(),
                comment.getReviewIteration().getId(),
                comment.getParentComment() == null ? null : comment.getParentComment().getId(),
                comment.getFile(),
                comment.getStartLine(),
                comment.getEndLine(),
                comment.getText(),
                comment.getCategory(),
                comment.getSeverity(),
                comment.getUser() == null ? null : comment.getUser().getId(),
                revealName ? getVisibleAuthorName(comment) : null,
                comment.getCommentAuthorRole(),
                revealName,
                getReviewerIndex(comment),
                formatDateTime(comment.getCreatedAt()),
                formatDateTime(comment.getUpdatedAt(), comment.getCreatedAt()),
                comment.getClosedAt() != null,
                comment.getClosedAt() == null ? "" : comment.getClosedAt().toString(),
                likedBy,
                dislikedBy,
                mapReplies(comment.getReplies(), includeAiComments)
        );
    }

    private List<ReviewCommentResponse> mapReplies(Set<Comment> replies, boolean includeAiComments) {
        List<ReviewCommentResponse> replyDtos = new ArrayList<>();
        for (Comment reply : replies) {
            ReviewCommentResponse mappedReply = mapToReviewCommentDto(reply, includeAiComments);
            if (mappedReply != null) {
                replyDtos.add(mappedReply);
            }
        }
        return replyDtos;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.toString();
    }

    private String formatDateTime(LocalDateTime dateTime, LocalDateTime fallback) {
        return formatDateTime(dateTime == null ? fallback : dateTime);
    }

    private Integer getReviewerIndex(Comment comment) {
        if (!CommentAuthorRole.REVIEWER.equals(comment.getCommentAuthorRole())) {
            return null;
        }
        if (comment.getReviewerIndex() != null) {
            return comment.getReviewerIndex();
        }
        return comment.getReviewIteration().getReview().getReviewerIndex();
    }

    private boolean isAuthorNameVisible(Comment comment) {
        if (CommentAuthorRole.AI.equals(comment.getCommentAuthorRole())
                || CommentAuthorRole.SYSTEM.equals(comment.getCommentAuthorRole())) {
            return true;
        }

        var task = comment.getReviewIteration().getReview().getTask();
        if (!TaskStatus.DONE.equals(task.getStatus())) {
            return false;
        }
        if (CommentAuthorRole.ASSIGNEE.equals(comment.getCommentAuthorRole())) {
            return task.getSolution() != null
                    && Boolean.TRUE.equals(task.getSolution().getRevealAuthorAfterReview());
        }
        if (CommentAuthorRole.REVIEWER.equals(comment.getCommentAuthorRole())) {
            return task.getReviews().stream()
                    .anyMatch(review -> Objects.equals(review.getUser(), comment.getUser())
                            && Boolean.TRUE.equals(review.getRevealAuthorAfterReview()));
        }
        return false;
    }

    private String getVisibleAuthorName(Comment comment) {
        if (CommentAuthorRole.AI.equals(comment.getCommentAuthorRole())) {
            return "AI";
        }
        if (CommentAuthorRole.SYSTEM.equals(comment.getCommentAuthorRole())) {
            return "Система";
        }
        String fullName = comment.getUser().getFullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return comment.getUser().getLogin();
    }

    private boolean isAiCommentsVisible(TaskStatus taskStatus) {
        return TaskStatus.DONE.equals(taskStatus) || TaskStatus.REWORK.equals(taskStatus);
    }

    public ReportCommentResponse mapToReportCommentResponse(CommentReport commentReport){
        return new ReportCommentResponse(
                commentReport.getId(),
                commentReport.getCommentReportData().getCommentId(),
                "CREATED"
        );
    }
}

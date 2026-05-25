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

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class CommentMapper {

    public List<ReviewCommentResponse> mapToReviewCommentResponses(Set<Comment> comments) {
        List<ReviewCommentResponse> reviewCommentResponses = new ArrayList<>();
        for (Comment comment : comments) {
            if (comment.getParentComment() == null) {
                reviewCommentResponses.add(mapToReviewCommentDto(comment));
            }
        }
        return reviewCommentResponses;
    }

    public ReviewCommentResponse mapToReviewCommentDto(Comment comment){
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
                comment.getUser().getId(),
                revealName ? getVisibleAuthorName(comment) : null,
                comment.getCommentAuthorRole(),
                revealName,
                getReviewerIndex(comment),
                comment.getCreatedAt().toString(),
                comment.getUpdatedAt().toString(),
                comment.getClosedAt() != null,
                comment.getClosedAt() == null ? "" : comment.getClosedAt().toString(),
                likedBy,
                dislikedBy,
                mapReplies(comment.getReplies())
        );
    }

    private List<ReviewCommentResponse> mapReplies(Set<Comment> replies) {
        List<ReviewCommentResponse> replyDtos = new ArrayList<>();
        for (Comment reply : replies) {
            replyDtos.add(mapToReviewCommentDto(reply));
        }
        return replyDtos;
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
                    .anyMatch(review -> review.getUser().equals(comment.getUser())
                            && Boolean.TRUE.equals(review.getRevealAuthorAfterReview()));
        }
        return false;
    }

    private String getVisibleAuthorName(Comment comment) {
        String fullName = comment.getUser().getFullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return comment.getUser().getLogin();
    }

    public ReportCommentResponse mapToReportCommentResponse(CommentReport commentReport){
        return new ReportCommentResponse(
                commentReport.getId(),
                commentReport.getComment().getId(),
                "CREATED"
        );
    }
}

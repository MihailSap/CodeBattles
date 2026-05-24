package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.comment.ReportCommentResponse;
import ru.urfu.backend.dto.comment.ReviewCommentResponse;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.CommentReaction;
import ru.urfu.backend.model.CommentReport;
import ru.urfu.backend.model.enums.ReactionType;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class CommentMapper {

    public List<ReviewCommentResponse> mapToReviewCommentResponses(Set<Comment> comments) {
        List<ReviewCommentResponse> reviewCommentResponses = new ArrayList<>();
        for (Comment comment : comments) {
            reviewCommentResponses.add(mapToReviewCommentDto(comment));
        }
        return reviewCommentResponses;
    }

    public ReviewCommentResponse mapToReviewCommentDto(Comment comment){
        List<Long> likedBy = new ArrayList<>();
        List<Long> dislikedBy = new ArrayList<>();
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
                comment.getUser().getFullName(),
                comment.getCommentAuthorRole(),
                comment.getRevealName(),
                comment.getReviewIteration().getReview().getReviewerIndex(),
                comment.getCreatedAt().toString(),
                comment.getUpdatedAt().toString(),
                comment.getClosedAt() != null,
                comment.getClosedAt() == null ? "" : comment.getClosedAt().toString(),
                likedBy,
                dislikedBy,
                null //FIXME
        );
    }

    public ReportCommentResponse mapToReportCommentResponse(CommentReport commentReport){
        return new ReportCommentResponse(
                commentReport.getId(),
                commentReport.getComment().getId(),
                "CREATED"
        );
    }
}

package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.admin.*;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ReactionType;
import ru.urfu.backend.repository.CommentReactionRepository;

import java.util.ArrayList;
import java.util.List;

@Component
public class AdminMapper {

    private final CommentReactionRepository commentReactionRepository;

    public AdminMapper(CommentReactionRepository commentReactionRepository) {
        this.commentReactionRepository = commentReactionRepository;
    }

    public AdminSystemSettingsDto mapToAdminSystemSettingsDto(SystemSettings systemSettings){
        long aiCommentLikes = commentReactionRepository.countByCommentAuthorRoleAndReaction(
                CommentAuthorRole.AI,
                ReactionType.LIKE
        );
        long aiCommentDislikes = commentReactionRepository.countByCommentAuthorRoleAndReaction(
                CommentAuthorRole.AI,
                ReactionType.DISLIKE
        );

        return new AdminSystemSettingsDto(
                systemSettings.getReviewDeadlineDays(),
                systemSettings.getAiSystemPrompt(),
                new AdminAiFeedbackStatsDto(
                        toDtoCount(aiCommentLikes),
                        toDtoCount(aiCommentDislikes),
                        0
                )
        );
    }

    public List<AdminCommentComplaintDto> mapToAdminCommentComplaintDtos(List<CommentReport> commentReports) {
        List<AdminCommentComplaintDto> adminCommentComplaintDtos = new ArrayList<>();
        for (CommentReport comment : commentReports) {
            adminCommentComplaintDtos.add(mapToAdminCommentComplaintDto(comment));
        }
        return adminCommentComplaintDtos;
    }

    private AdminCommentComplaintDto mapToAdminCommentComplaintDto(CommentReport commentReport){
        CommentReportData commentReportData = commentReport.getCommentReportData();
        Comment comment = commentReport.getComment();
        Long commentId = commentReportData != null ? commentReportData.getCommentId() : getCommentId(comment);
        String commentText = commentReportData != null ? commentReportData.getCommentText() : getCommentText(comment);
        User commentAuthor = commentReportData != null ? commentReportData.getUser() : getCommentAuthor(comment);
        Review review = commentReportData != null ? commentReportData.getReview() : getCommentReview(comment);

        return new AdminCommentComplaintDto(
                commentReport.getId(),
                commentId,
                commentText,
                mapToAdminUserBriefDto(commentAuthor),
                mapToAdminComplaintTargetDto(review),
                commentReport.getReason(),
                mapToAdminUserBriefDto(commentReport.getUser()),
                commentReport.getCreatedAt()
        );
    }

    private AdminUserBriefDto mapToAdminUserBriefDto(User user){
        if (user == null) {
            return new AdminUserBriefDto(
                    0L,
                    "deleted-user",
                    "Пользователь недоступен"
            );
        }

        return new AdminUserBriefDto(
                user.getId(),
                user.getLogin(),
                user.getFullName()
        );
    }

    private int toDtoCount(long count) {
        return count > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) count;
    }

    private AdminComplaintTargetDto mapToAdminComplaintTargetDto(Review review){
        if (review == null || review.getTask() == null) {
            return new AdminComplaintTargetDto(
                    "unknown",
                    "Контекст недоступен",
                    null,
                    null,
                    null,
                    null
            );
        }

        Task task = review.getTask();
        Project project = task.getProject();
        return new AdminComplaintTargetDto(
                "review",
                task.getTitle(),
                "/reviews/" + review.getId(),
                project != null ? project.getId() : null,
                task.getId(),
                review.getId()
        );
    }

    private Long getCommentId(Comment comment) {
        return comment != null ? comment.getId() : null;
    }

    private String getCommentText(Comment comment) {
        return comment != null ? comment.getText() : "Комментарий недоступен";
    }

    private User getCommentAuthor(Comment comment) {
        return comment != null ? comment.getUser() : null;
    }

    private Review getCommentReview(Comment comment) {
        if (comment == null || comment.getReviewIteration() == null) {
            return null;
        }
        return comment.getReviewIteration().getReview();
    }
}

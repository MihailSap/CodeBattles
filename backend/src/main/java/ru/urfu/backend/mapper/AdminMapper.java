package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.admin.*;
import ru.urfu.backend.model.*;

import java.util.ArrayList;
import java.util.List;

@Component
public class AdminMapper {

    public AdminSystemSettingsDto mapToAdminSystemSettingsDto(SystemSettings systemSettings){
        return new AdminSystemSettingsDto(
                systemSettings.getReviewDeadlineDays(),
                systemSettings.getAiSystemPrompt(),
                new AdminAiFeedbackStatsDto(
                        0,
                        0,
                        30
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
        return new AdminCommentComplaintDto(
                commentReport.getId(),
                commentReportData.getCommentId(),
                commentReportData.getCommentText(),
                mapToAdminUserBriefDto(commentReportData.getUser()),
                mapToAdminComplaintTargetDto(commentReportData.getReview()),
                commentReport.getReason(),
                mapToAdminUserBriefDto(commentReport.getUser()),
                commentReport.getCreatedAt()
        );
    }

    private AdminUserBriefDto mapToAdminUserBriefDto(User user){
        return new AdminUserBriefDto(
                user.getId(),
                user.getLogin(),
                user.getFullName()
        );
    }

    private AdminComplaintTargetDto mapToAdminComplaintTargetDto(Review review){
        return new AdminComplaintTargetDto(
                "review",
                review.getTask().getTitle(),
                "/reviews/" + review.getId(),
                review.getTask().getProject().getId(),
                review.getTask().getId(),
                review.getId()
        );
    }
}

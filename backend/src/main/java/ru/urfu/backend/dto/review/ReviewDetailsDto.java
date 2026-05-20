package ru.urfu.backend.dto.review;

import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.SolutionUploadType;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record ReviewDetailsDto(
        Long id,
        Long taskId,
        Long projectId,
        ReviewProjectResponse project,
        ReviewOrganizationResponse organization,
        String taskName,
        TaskStatus taskStatus,
        ReviewStatus status,
        ReviewType reviewType,
        SolutionUploadType uploadType,
        String uploadedAt,
        String deadline,
        String completedAt,
        String visibleInReviewListUntil,
        Boolean revealAuthorAfterReview,
        List<ReviewUserResponse> assignees,
        List<ReviewUserResponse> reviewers,
        ViewerAssignmentDto viewerAssignment,
        List<FileDto> files,
        List<CommentDto> comments,
        List<HistoryEventDto> history,
        List<FinalReviewDto> finalReviews,
        AiEvaluationDto aiEvaluation,
        AiReviewEvaluationDto aiReviewEvaluation,
        PermissionsDto permissions
) {}


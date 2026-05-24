package ru.urfu.backend.dto.review;

import ru.urfu.backend.dto.comment.ReviewCommentResponse;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.SolutionUploadType;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record ReviewDetailsResponse(
        Long id,
        Long taskId,
        Long projectId,
        Long solutionId,
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
        Boolean revealAuthorReview,
        Boolean revealAuthorSolution,
        List<ReviewUserResponse> assignees,
        List<ReviewUserResponse> reviewers,
        ViewerAssignmentResponse viewerAssignment,
        List<ReviewFileContentResponse> files,
        List<ReviewCommentResponse> comments,
        List<ReviewHistoryResponse> history,
        List<FinalReviewResponse> finalReviews,
        AiEvaluationDto aiEvaluation,
        AiReviewEvaluationDto aiReviewEvaluation,
        PermissionsResponse permissions
) {}


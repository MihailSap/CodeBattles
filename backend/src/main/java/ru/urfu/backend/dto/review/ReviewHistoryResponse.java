package ru.urfu.backend.dto.review;

import ru.urfu.backend.dto.comment.ReviewCommentResponse;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record ReviewHistoryResponse(
        Long id,
        Integer iterationNumber,
        String uploadedAt,
        String completedAt,
        TaskStatus taskStatusAfterIteration,
        List<ReviewFileContentResponse> files,
        List<ReviewCommentResponse> comments,
        FinalReviewResponse finalReview
) {
}


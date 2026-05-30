package ru.urfu.backend.dto.review;

public record PermissionsResponse(
        Boolean canAddComments,
        Boolean canSubmitFinalReview,
        Boolean canReply,
        Boolean canReact,
        Boolean canReport,
        Boolean canReopenThread
) {
}


package ru.urfu.backend.dto.review;

public record PermissionsDto(
        Boolean canAddComments,
        Boolean canSubmitFinalReview,
        Boolean canReply,
        Boolean canReact,
        Boolean canReport,
        Boolean canReopenThread
) {
}


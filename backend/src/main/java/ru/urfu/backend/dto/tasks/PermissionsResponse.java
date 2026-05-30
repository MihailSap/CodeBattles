package ru.urfu.backend.dto.tasks;

public record PermissionsResponse(
        Boolean canViewTask,
        Boolean canManageSettings,
        Boolean canUploadSolution,
        Boolean canFinishReview,
        String viewerRole
) {
}

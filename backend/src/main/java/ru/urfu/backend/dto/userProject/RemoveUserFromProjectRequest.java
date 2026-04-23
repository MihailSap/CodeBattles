package ru.urfu.backend.dto.userProject;

public record RemoveUserFromProjectRequest(
        Long userId,
        Long projectId
) {
}

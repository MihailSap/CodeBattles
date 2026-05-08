package ru.urfu.backend.dto.project;

public record ProjectJoinedResponse(
        Boolean joined,
        Long projectId
) {
}

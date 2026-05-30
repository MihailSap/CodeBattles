package ru.urfu.backend.dto.dashboard;

import ru.urfu.backend.model.enums.TaskStatus;

import java.time.LocalDateTime;

public record DashboardTaskItemDto(
        Long id,
        Long projectId,
        String projectName,
        String taskName,
        TaskStatus status,
        LocalDateTime deadline
) {
}

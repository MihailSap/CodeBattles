package ru.urfu.backend.dto.tasks;

import ru.urfu.backend.model.enums.ReviewType;

import java.util.List;

public record CreateTaskRequestDto(
        String name,
        String description,
        String requirements,
        String evaluationCriteria,
        String deadline,
        ReviewType reviewType,
        List<Long> assigneeIds,
        List<Long> reviewerIds
) {
}

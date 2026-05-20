package ru.urfu.backend.dto.review;

import java.util.List;

public record ReviewResendRequest(
        Long taskId,
        List<Long> reviewerIds
) {
}

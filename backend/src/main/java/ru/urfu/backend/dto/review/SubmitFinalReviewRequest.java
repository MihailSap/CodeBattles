package ru.urfu.backend.dto.review;

import ru.urfu.backend.model.enums.ReviewVerdictType;

public record SubmitFinalReviewRequest(
        Integer architecture,
        Integer readability,
        Integer testability,
        Integer scalability,
        String comment,
        ReviewVerdictType verdict,
        Boolean revealName
) {
}

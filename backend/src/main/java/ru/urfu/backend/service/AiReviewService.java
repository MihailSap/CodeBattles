package ru.urfu.backend.service;

import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.ReviewIteration;

public interface AiReviewService {
    void analyzeSolution(ReviewIteration reviewIteration);

    void evaluateReview(Review review);
}

package ru.urfu.backend.service;

import ru.urfu.backend.dto.dashboard.DashboardTaskFilterStatus;
import ru.urfu.backend.dto.review.SubmitFinalReviewRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.*;

import java.util.List;

public interface ReviewService {

    List<Review> getDashboardReviews(User user, Long projectId, DashboardTaskFilterStatus status);

    Review getById(Long id);

    List<Review> getReviewsByUser(User user);

    Review create(User user, Solution solution, Integer reviewerIndex);

    List<Review> create(List<User> users, Solution solution) throws UserNotFoundException;

    ReviewVerdict createVerdict(SubmitFinalReviewRequest request, Review review);

    ReviewIteration createReviewIteration(Review review);

    ReviewFileContent createReviewFileContent(
            ReviewIteration reviewIteration, SolutionManualText solutionManualText);

    ReviewFileContent createReviewFileContent(
            ReviewIteration previousIteration, ReviewIteration currentIteration, SolutionManualText solutionManualText);

    void completeExpiredReviews(List<Review> reviews);

    Review updateStatusInProgress(Review review);

    Review updateStatusCompleted(Review review);

    Review updateRevealName(Boolean revealName, Review review);
}

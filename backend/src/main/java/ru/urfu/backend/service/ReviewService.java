package ru.urfu.backend.service;

import ru.urfu.backend.dto.dashboard.DashboardTaskFilterStatus;
import ru.urfu.backend.dto.review.SubmitFinalReviewRequest;
import ru.urfu.backend.model.*;

import java.util.List;
import java.util.Set;

public interface ReviewService {

    Review getByUserAndTask(User user, Task task);

    List<Review> getDashboardReviews(User user, Long projectId, DashboardTaskFilterStatus status);

    Review getById(Long id);

    List<Review> getReviewsByUser(User user);

    Review create(User user, Solution solution, Integer reviewerIndex) throws Exception;

    List<Review> create(List<User> users, Solution solution) throws Exception;

    ReviewVerdict createVerdict(SubmitFinalReviewRequest request, Review review);

    ReviewIteration createReviewIteration(Review review);

    ReviewFileContent createReviewFileContent(
            ReviewIteration reviewIteration, SolutionManualText solutionManualText);

    void createReviewFileContent(
            ReviewIteration reviewIteration, SolutionGitPullRequest solutionGitPullRequest
    ) throws Exception;

    void createReviewFileContents(ReviewIteration reviewIteration, Set<SolutionFile> solutionFiles);

    ReviewFileContent updateReviewFileContent(
            ReviewIteration previousIteration, ReviewIteration currentIteration, SolutionManualText solutionManualText);

    void updateReviewFileContents(
            ReviewIteration previousIteration, ReviewIteration currentIteration, Set<SolutionFile> solutionFiles);

    void completeExpiredReviews(List<Review> reviews);

    Review updateStatusInProgress(Review review);

    Review updateStatusCompleted(Review review);

    Review updateRevealName(Boolean revealName, Review review);
}

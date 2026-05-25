package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.dashboard.DashboardTaskFilterStatus;
import ru.urfu.backend.dto.review.SubmitFinalReviewRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.repository.ReviewFileContentRepository;
import ru.urfu.backend.repository.ReviewIterationRepository;
import ru.urfu.backend.repository.ReviewRepository;
import ru.urfu.backend.repository.ReviewVerdictRepository;
import ru.urfu.backend.service.ReviewService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewVerdictRepository reviewVerdictRepository;
    private final ReviewIterationRepository reviewIterationRepository;
    private final ReviewFileContentRepository reviewFileContentRepository;

    @Autowired
    public ReviewServiceImpl(
            ReviewVerdictRepository reviewVerdictRepository,
            ReviewRepository reviewRepository,
            ReviewIterationRepository reviewIterationRepository,
            ReviewFileContentRepository reviewFileContentRepository
    ) {
        this.reviewVerdictRepository = reviewVerdictRepository;
        this.reviewRepository = reviewRepository;
        this.reviewIterationRepository = reviewIterationRepository;
        this.reviewFileContentRepository = reviewFileContentRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Review getByUserAndTask(User user, Task task) {
        return reviewRepository.findByUserAndTask(user, task)
                .orElseThrow(() -> new RuntimeException("У данного пользователя нет ревью для этой задачи"));
    }

    @Transactional(readOnly = true)
    @Override
    public List<Review> getDashboardReviews(
            User user, Long projectId, DashboardTaskFilterStatus status) {
        List<Review> reviews = reviewRepository.findByUser(user);
        LocalDateTime now = LocalDateTime.now();
        return reviews.stream()
                .filter(review -> ReviewStatus.NEW.equals(review.getStatus())
                        || ReviewStatus.IN_PROGRESS.equals(review.getStatus())
                )
                .filter(review -> projectId == null || review.getTask()
                        .getProject()
                        .getId()
                        .equals(projectId)
                )
                .filter(review -> {
                    if(status == null || DashboardTaskFilterStatus.ALL.equals(status)){
                        return true;
                    }
                    LocalDateTime deadline = review.getLastIteration().getDeadline();
                    boolean overdue = deadline != null && deadline.isBefore(now);
                    if(DashboardTaskFilterStatus.ACTIVE.equals(status)){
                        return !overdue;
                    }
                    if(DashboardTaskFilterStatus.OVERDUE.equals(status)){
                        return overdue;
                    }

                    return true;
                })
                .sorted((a, b) -> {
                    LocalDateTime aDeadline = a.getLastIteration().getDeadline();
                    LocalDateTime bDeadline = b.getLastIteration().getDeadline();
                    if(aDeadline == null && bDeadline == null){
                        return 0;
                    }
                    if(aDeadline == null){
                        return 1;
                    }
                    if(bDeadline == null){
                        return -1;
                    }
                    return aDeadline.compareTo(bDeadline);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public Review getById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ревью не найдено"));
    }

    @Transactional
    @Override
    public void completeExpiredReviews(List<Review> reviews) {
        LocalDateTime now = LocalDateTime.now();
        for (Review review : reviews) {
            if (ReviewStatus.COMPLETED.equals(review.getStatus())) {
                continue;
            }
            ReviewIteration reviewIteration = review.getLastIteration();
            if (reviewIteration == null) {
                continue;
            }
            if (now.isAfter(reviewIteration.getDeadline())) {
                review.setStatus(ReviewStatus.COMPLETED);
                reviewRepository.save(review);
            }
        }
    }

    @Transactional
    @Override
    public List<Review> getReviewsByUser(User user) {
        List<Review> reviews = reviewRepository.findByUser(user);
        completeExpiredReviews(reviews);
        LocalDateTime now = LocalDateTime.now();
        List<Review> filteredReviews = new ArrayList<>();
        for (Review review : reviews) {
            ReviewIteration reviewIteration = review.getLastIteration();
            if (reviewIteration == null) {
                continue;
            }
            LocalDateTime completedAt = reviewIteration.getCompletedAt();
            LocalDateTime deadline = reviewIteration.getDeadline();
            if (ReviewStatus.COMPLETED.equals(review.getStatus())) {
                LocalDateTime visibleUntil;
                if (completedAt != null) {
                    visibleUntil = completedAt.plusDays(7);
                }
                else {
                    visibleUntil = deadline.plusDays(7);
                }
                if (now.isBefore(visibleUntil)) {
                    filteredReviews.add(review);
                }
                continue;
            }
            filteredReviews.add(review);
        }
        return filteredReviews;
    }

    @Transactional
    @Override
    public List<Review> create(List<User> reviewers, Solution solution) throws UserNotFoundException {
        List<Review> reviews = new ArrayList<>();
        int reviewerIndex = 1;
        for (User reviewer : reviewers) {
            Review review = create(reviewer, solution, reviewerIndex);
            reviews.add(review);
            reviewerIndex++;
        }
        return reviews;
    }

    @Transactional
    @Override
    public Review create(User user, Solution solution, Integer reviewerIndex) {
        Review review = new Review();
        review.setUser(user);
        review.setTask(solution.getTask());
        review.setSolution(solution);
        review.setReviewerIndex(reviewerIndex);
        review.setStatus(ReviewStatus.NEW);
        reviewRepository.save(review);

        ReviewIteration reviewIteration = createReviewIteration(review);
        createReviewFileContent(reviewIteration, solution.getSolutionManualText());

        return review;
    }

    @Transactional
    @Override
    public ReviewIteration createReviewIteration(Review review){
        LocalDateTime now = LocalDateTime.now();
        ReviewIteration reviewIteration = new ReviewIteration();
        reviewIteration.setReview(review);
        reviewIteration.setUploadedAt(now);
        reviewIteration.setDeadline(now.plusDays(14));
        reviewIteration.setTaskStatusAfterIteration(TaskStatus.IN_REVIEW);

        ReviewIteration lastReviewIteration = review.getLastIteration();
        if(lastReviewIteration == null){
            reviewIteration.setIterationNumber(1);
        } else {
            reviewIteration.setIterationNumber(lastReviewIteration.getIterationNumber() + 1);
        }
        return reviewIterationRepository.save(reviewIteration);
    }

    @Transactional
    @Override
    public ReviewFileContent createReviewFileContent(
            ReviewIteration reviewIteration,
            SolutionManualText solutionManualText){

        ReviewFileContent reviewFileContent = new ReviewFileContent();
        reviewFileContent.setLanguage(solutionManualText.getLanguage());
        reviewFileContent.setContent(solutionManualText.getContent());
        reviewFileContent.setPath(solutionManualText.getFileName());
        reviewFileContent.setReviewIteration(reviewIteration);
        reviewFileContent.setUnsupportedPreview(false);
        reviewFileContent.setDiff(false);
        reviewFileContent.setOldContent(null);

        return reviewFileContentRepository.save(reviewFileContent);
    }

    @Transactional
    @Override
    public ReviewFileContent createReviewFileContent(
            ReviewIteration previousIteration, ReviewIteration currentIteration, SolutionManualText solutionManualText){
        ReviewFileContent reviewFileContent = new ReviewFileContent();
        reviewFileContent.setLanguage(solutionManualText.getLanguage());
        reviewFileContent.setContent(solutionManualText.getContent());
        reviewFileContent.setPath(solutionManualText.getFileName());
        reviewFileContent.setReviewIteration(currentIteration);
        reviewFileContent.setUnsupportedPreview(false);

        ReviewFileContent previousFileContent = previousIteration
                .getReviewFileContents()
                .stream()
                .filter(file -> solutionManualText.getFileName().equals(file.getPath()))
                .findFirst()
                .orElse(null);

        if(previousFileContent == null){
            reviewFileContent.setDiff(false);
            reviewFileContent.setOldContent(null);
        } else {
            reviewFileContent.setDiff(true);
            reviewFileContent.setOldContent(previousFileContent.getContent());
        }

        return reviewFileContentRepository.save(reviewFileContent);
    }

    @Transactional
    @Override
    public ReviewVerdict createVerdict(SubmitFinalReviewRequest request, Review review) {
        ReviewIteration reviewIteration = review.getLastIteration();

        ReviewVerdict reviewVerdict = new ReviewVerdict();
        reviewVerdict.setReviewIteration(reviewIteration);

        reviewIteration.setReviewVerdict(reviewVerdict);

        reviewVerdict.setVerdict(request.verdict());
        reviewVerdict.setArchitecture(request.architecture());
        reviewVerdict.setReadability(request.readability());
        reviewVerdict.setScalability(request.scalability());
        reviewVerdict.setTestability(request.testability());
        reviewVerdict.setComment(request.comment());

        int overallScore = Math.round((
                request.architecture()
                        + request.readability()
                        + request.testability()
                        + request.scalability()
        ) / 4.0f);

        reviewVerdict.setOverallScore(overallScore);
        return reviewVerdictRepository.save(reviewVerdict);
    }

    @Transactional
    @Override
    public Review updateStatusInProgress(Review review) {
        review.setStatus(ReviewStatus.IN_PROGRESS);
        return reviewRepository.save(review);
    }

    @Transactional
    @Override
    public Review updateStatusCompleted(Review review) {
        ReviewIteration reviewIteration = review.getLastIteration();
        reviewIteration.setCompletedAt(LocalDateTime.now());
        reviewIterationRepository.save(reviewIteration);

        review.setStatus(ReviewStatus.COMPLETED);
        return reviewRepository.save(review);
    }

    @Override
    public Review updateRevealName(Boolean revealName, Review review) {
        review.setRevealAuthorAfterReview(revealName);
        return reviewRepository.save(review);
    }
}
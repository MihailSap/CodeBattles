package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.Solution;
import ru.urfu.backend.model.User;
import ru.urfu.backend.repository.ReviewRepository;
import ru.urfu.backend.service.ReviewService;
import ru.urfu.backend.service.UserService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserService userService;

    @Autowired
    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            UserService userService
    ) {
        this.reviewRepository = reviewRepository;
        this.userService = userService;
    }

    @Override
    public Review getById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ревью не найдено"));
    }

    @Transactional(readOnly = true)
    @Override
    public List<Review> getByUser(User user) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(7);
        return reviewRepository.findByUserAndCompletedAtAfter(user, threshold);
    }

    @Transactional
    @Override
    public Review create(User user,Solution solution){
        Review review = new Review();
        review.setUser(user);
        review.setTask(solution.getTask());
        review.setSolution(solution);
        return reviewRepository.save(review);
    }

    @Transactional
    @Override
    public List<Review> create(List<Long> reviewerIds, Solution solution) throws UserNotFoundException {
        List<Review> reviews = new ArrayList<>();
        for(Long reviewerId : reviewerIds){
            Review review = new Review();
            review.setUser(userService.getById(reviewerId));
            review.setSolution(solution);
            review.setTask(solution.getTask());
            reviewRepository.save(review);
            reviews.add(review);
        }
        return reviews;
    }
}

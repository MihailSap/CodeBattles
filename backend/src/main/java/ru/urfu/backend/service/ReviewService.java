package ru.urfu.backend.service;

import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.Solution;
import ru.urfu.backend.model.User;

import java.util.List;

public interface ReviewService {

    Review getById(Long id);

    List<Review> getByUser(User user);

    Review create(User user, Solution solution);

    List<Review> create(List<Long> reviewerIds, Solution solution) throws UserNotFoundException;
}

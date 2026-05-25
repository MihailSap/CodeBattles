package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByUser(User user);

    Optional<Review> findByUserAndTask(User user, Task task);
}


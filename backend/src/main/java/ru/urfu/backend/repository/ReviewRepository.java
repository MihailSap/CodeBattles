package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
}


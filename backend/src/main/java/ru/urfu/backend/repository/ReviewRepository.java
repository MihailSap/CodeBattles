package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.User;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("""
    SELECT r FROM review r
    WHERE r.user = :user
      AND (r.completedAt IS NULL OR r.completedAt >= :threshold)
    """)
    List<Review> findByUserAndCompletedAtAfter(
            @Param("user") User user,
            @Param("threshold") LocalDateTime threshold
    );


    List<Review> findByUser(User user);
}


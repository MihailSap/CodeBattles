package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.AiReviewEvaluation;
import ru.urfu.backend.model.ReviewIteration;

import java.util.Optional;

@Repository
public interface AiReviewEvaluationRepository extends JpaRepository<AiReviewEvaluation, Long> {
    Optional<AiReviewEvaluation> findByReviewIteration(ReviewIteration reviewIteration);
}

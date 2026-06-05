package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.AiSolutionEvaluation;
import ru.urfu.backend.model.ReviewIteration;

import java.util.Optional;

@Repository
public interface AiSolutionEvaluationRepository extends JpaRepository<AiSolutionEvaluation, Long> {
    Optional<AiSolutionEvaluation> findByReviewIteration(ReviewIteration reviewIteration);
}

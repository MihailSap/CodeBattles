package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.ReviewVerdict;

@Repository
public interface ReviewVerdictRepository extends JpaRepository<ReviewVerdict, Long> {
}

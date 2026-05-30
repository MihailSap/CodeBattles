package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.ReviewIteration;

@Repository
public interface ReviewIterationRepository extends JpaRepository<ReviewIteration, Long> {
}

package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.SolutionManualText;

@Repository
public interface SolutionManualTextRepository extends JpaRepository<SolutionManualText, Long> {
}

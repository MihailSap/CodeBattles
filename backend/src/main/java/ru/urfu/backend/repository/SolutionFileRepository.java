package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.SolutionFile;

@Repository
public interface SolutionFileRepository extends JpaRepository<SolutionFile, Long> {
}

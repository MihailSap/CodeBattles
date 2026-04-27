package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.ProjectStack;

@Repository
public interface ProjectStackRepository extends JpaRepository<ProjectStack, Long> {
}

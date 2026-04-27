package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;

import java.util.Optional;

public interface UserProjectRepository extends JpaRepository<UserProject, Long> {

    Optional<UserProject> findByUserAndProject(User user, Project project);
}

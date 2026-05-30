package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;

import java.util.List;
import java.util.Optional;

public interface UserProjectRepository extends JpaRepository<UserProject, Long>, JpaSpecificationExecutor<UserProject> {

    List<UserProject> findAllByUser(User user);

    Optional<UserProject> findByUserAndProject(User user, Project project);
}

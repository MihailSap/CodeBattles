package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    List<Project> findByIsPrivateFalseAndOrganizationNull();

    Boolean existsByTitle(String title);

    Optional<Project> findByTitleAndOrganization(String title, Organization organization);

    Optional<Project> findByTitleAndUsers_User(String title, User user);
}

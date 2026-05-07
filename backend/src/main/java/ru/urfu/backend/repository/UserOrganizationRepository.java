package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;

import java.util.Optional;

@Repository
public interface UserOrganizationRepository extends JpaRepository<UserOrganization, Long>, JpaSpecificationExecutor<UserOrganization> {
    Optional<UserOrganization> findByUserAndOrganization(User user, Organization organization);
}

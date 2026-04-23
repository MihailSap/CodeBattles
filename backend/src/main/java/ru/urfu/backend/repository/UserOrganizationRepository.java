package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.UserOrganization;

@Repository
public interface UserOrganizationRepository extends JpaRepository<UserOrganization, Long> {
}

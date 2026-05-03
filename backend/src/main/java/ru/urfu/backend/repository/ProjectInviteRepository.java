package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.ProjectInvite;

import java.util.Optional;

@Repository
public interface ProjectInviteRepository extends JpaRepository<ProjectInvite, Long> {
    Optional<ProjectInvite> findByToken(String token);
}

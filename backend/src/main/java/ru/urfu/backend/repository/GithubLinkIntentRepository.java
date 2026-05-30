package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.GithubLinkIntent;

import java.util.Optional;

@Repository
public interface GithubLinkIntentRepository extends JpaRepository<GithubLinkIntent, Long> {

    Optional<GithubLinkIntent> findByToken(String token);
}

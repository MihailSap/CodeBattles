package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.SolutionGitPullRequest;

@Repository
public interface SolutionGitPullRequestRepository extends JpaRepository<SolutionGitPullRequest, Long> {
}

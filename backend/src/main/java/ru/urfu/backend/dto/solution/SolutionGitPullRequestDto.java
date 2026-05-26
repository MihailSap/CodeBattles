package ru.urfu.backend.dto.solution;

import ru.urfu.backend.model.enums.GitProvider;

public record SolutionGitPullRequestDto(
        GitProvider provider,
        String repositoryId,
        String repositoryName,
        String pullRequestId,
        Integer pullRequestNumber,
        String sourceBranch,
        String targetBranch,
        String url
) {
}

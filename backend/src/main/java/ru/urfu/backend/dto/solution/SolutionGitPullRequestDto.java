package ru.urfu.backend.dto.solution;

public record SolutionGitPullRequestDto(
        String repositoryId,
        String repositoryName,
        String pullRequestId,
        Integer pullRequestNumber,
        String sourceBranch,
        String targetBranch,
        String url
) {
}

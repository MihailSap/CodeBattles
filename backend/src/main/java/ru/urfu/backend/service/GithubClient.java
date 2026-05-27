package ru.urfu.backend.service;

import ru.urfu.backend.dto.solution.SolutionGitPullRequestDto;
import ru.urfu.backend.dto.solution.GithubPullRequestOptionResponse;
import ru.urfu.backend.exception.globalEx.InvalidException;

import java.util.List;

public interface GithubClient {

    String fetchEmail(String accessToken);

    String fetchLoginByGithubId(String githubId);

    SolutionGitPullRequestDto resolvePullRequest(String pullRequestUrl) throws InvalidException;

    List<GithubPullRequestOptionResponse> fetchOpenPullRequestsByAuthor(String githubLogin);
}

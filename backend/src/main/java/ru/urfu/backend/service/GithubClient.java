package ru.urfu.backend.service;

public interface GithubClient {

    String fetchEmail(String accessToken);

    String fetchLoginByGithubId(String githubId);
}

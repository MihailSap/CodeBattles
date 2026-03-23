package ru.urfu.backend.service;

public interface GithubClient {
    String fetchEmail(String accessToken);
}

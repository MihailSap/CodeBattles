package ru.urfu.backend.dto.solution;

public record GithubPullRequestOptionResponse(
        String title,
        String url,
        Integer number
) {
}

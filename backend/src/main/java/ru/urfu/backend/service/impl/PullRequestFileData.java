package ru.urfu.backend.service.impl;

public record PullRequestFileData(
        String path,
        String content,
        String oldContent
) {
}

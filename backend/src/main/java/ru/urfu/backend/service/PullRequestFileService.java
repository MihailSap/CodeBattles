package ru.urfu.backend.service;

import ru.urfu.backend.service.impl.PullRequestFileData;

import java.util.List;

public interface PullRequestFileService {

    List<PullRequestFileData> getFiles(String repoUrl, String sourceBranch, String targetBranch) throws Exception;
}

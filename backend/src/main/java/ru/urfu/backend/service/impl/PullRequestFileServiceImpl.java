package ru.urfu.backend.service.impl;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.util.io.DisabledOutputStream;
import org.springframework.stereotype.Service;
import ru.urfu.backend.service.PullRequestFileService;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class PullRequestFileServiceImpl implements PullRequestFileService {

    @Override
    public List<PullRequestFileData> getFiles(
            String repoUrl,
            String sourceBranch,
            String targetBranch
    ) {

        File tempDir = null;

        try {
            tempDir = Files.createTempDirectory("repo").toFile();

            try (Git git = Git.cloneRepository()
                    .setURI(repoUrl)
                    .setDirectory(tempDir)
                    .call()) {

                Repository repository = git.getRepository();

                ObjectId sourceCommitId =
                        repository.resolve(
                                "refs/remotes/origin/" + sourceBranch
                        );

                if (sourceCommitId == null) {
                    throw new IllegalArgumentException(
                            "Ветка sourceBranch не найдена: "
                                    + sourceBranch
                    );
                }

                ObjectId targetCommitId =
                        repository.resolve(
                                "refs/remotes/origin/" + targetBranch
                        );

                if (targetCommitId == null) {
                    throw new IllegalArgumentException(
                            "Ветка targetBranch не найдена: "
                                    + targetBranch
                    );
                }

                RevCommit sourceCommit = git.log()
                        .add(sourceCommitId)
                        .setMaxCount(1)
                        .call()
                        .iterator()
                        .next();

                RevCommit targetCommit = git.log()
                        .add(targetCommitId)
                        .setMaxCount(1)
                        .call()
                        .iterator()
                        .next();

                DiffFormatter diffFormatter =
                        new DiffFormatter(
                                DisabledOutputStream.INSTANCE
                        );

                diffFormatter.setRepository(repository);

                List<DiffEntry> diffs = diffFormatter.scan(
                        targetCommit.getTree(),
                        sourceCommit.getTree()
                );

                List<PullRequestFileData> result =
                        new ArrayList<>();

                for (DiffEntry diff : diffs) {

                    DiffEntry.ChangeType changeType =
                            diff.getChangeType();

                    String path;

                    switch (changeType) {

                        case DELETE -> path = diff.getOldPath();

                        case ADD,
                             MODIFY,
                             COPY,
                             RENAME -> path = diff.getNewPath();

                        default -> path = diff.getNewPath();
                    }

                    String content = null;
                    String oldContent = null;

                    if (!DiffEntry.ChangeType.DELETE.equals(changeType)) {

                        content = readFile(
                                repository,
                                sourceCommit,
                                diff.getNewPath()
                        );
                    }

                    if (!DiffEntry.ChangeType.ADD.equals(changeType)) {

                        oldContent = readFile(
                                repository,
                                targetCommit,
                                diff.getOldPath()
                        );
                    }

                    PullRequestFileData fileData =
                            new PullRequestFileData(
                                    path,
                                    content,
                                    oldContent
                            );

                    result.add(fileData);
                }

                return result;
            }

        } catch (Exception ex) {

            throw new RuntimeException(
                    "Ошибка при получении diff pull request: "
                            + ex.getMessage(),
                    ex
            );

        } finally {

            if (tempDir != null) {
                deleteDirectory(tempDir.toPath());
            }
        }
    }

    private String readFile(
            Repository repository,
            RevCommit commit,
            String path
    ) throws Exception {

        if (path == null || DiffEntry.DEV_NULL.equals(path)) {
            return null;
        }

        try (TreeWalk treeWalk =
                     TreeWalk.forPath(
                             repository,
                             path,
                             commit.getTree()
                     )) {

            if (treeWalk == null) {
                return null;
            }

            ObjectId objectId = treeWalk.getObjectId(0);

            ObjectLoader loader =
                    repository.open(objectId);

            return new String(
                    loader.getBytes(),
                    StandardCharsets.UTF_8
            );
        }
    }

    private void deleteDirectory(java.nio.file.Path path) {

        if (path == null || !Files.exists(path)) {
            return;
        }

        try (Stream<java.nio.file.Path> paths =
                     Files.walk(path)) {

            paths.sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {
                        }
                    });

        } catch (IOException ignored) {
        }
    }
}
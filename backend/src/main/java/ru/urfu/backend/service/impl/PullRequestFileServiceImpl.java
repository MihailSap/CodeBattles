package ru.urfu.backend.service.impl;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.springframework.stereotype.Service;
import ru.urfu.backend.service.PullRequestFileService;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;

@Service
public class PullRequestFileServiceImpl implements PullRequestFileService {

    @Override
    public List<PullRequestFileData> getFiles(String repoUrl, String sourceBranch, String targetBranch) throws Exception {
        File tempDir = Files.createTempDirectory("repo").toFile();
        try (Git git = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(tempDir)
                .call()) {
            Repository repository = git.getRepository();
            ObjectId sourceCommitId =
                    repository.resolve("refs/remotes/origin/" + sourceBranch);
            ObjectId targetCommitId =
                    repository.resolve("refs/remotes/origin/" + targetBranch);
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

            Set<String> allPaths = new HashSet<>();
            allPaths.addAll(getAllPaths(repository, sourceCommit));
            allPaths.addAll(getAllPaths(repository, targetCommit));

            List<PullRequestFileData> result = new ArrayList<>();
            for (String path : allPaths) {
                String content = readFile(repository, sourceCommit, path);
                String oldContent = readFile(repository, targetCommit, path);
                if (Objects.equals(content, oldContent)) {
                    continue;
                }
                result.add(new PullRequestFileData(path, content, oldContent));
            }

            return result;
        }
    }

    private Set<String> getAllPaths(Repository repository, RevCommit commit) throws Exception {
        Set<String> paths = new HashSet<>();
        try (TreeWalk treeWalk = new TreeWalk(repository)) {
            treeWalk.addTree(commit.getTree());
            treeWalk.setRecursive(true);

            while (treeWalk.next()) {
                paths.add(treeWalk.getPathString());
            }
        }

        return paths;
    }

    private String readFile(Repository repository, RevCommit commit, String path) throws Exception {
        try (TreeWalk treeWalk =
                     TreeWalk.forPath(repository, path, commit.getTree())) {
            if (treeWalk == null) {
                return null;
            }

            ObjectId objectId = treeWalk.getObjectId(0);
            ObjectLoader loader = repository.open(objectId);
            return new String(loader.getBytes(), StandardCharsets.UTF_8);
        }
    }
}
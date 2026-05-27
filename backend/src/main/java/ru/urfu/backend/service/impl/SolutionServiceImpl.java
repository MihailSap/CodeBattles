package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.SolutionArchiveRequest;
import ru.urfu.backend.dto.solution.SolutionFileRequest;
import ru.urfu.backend.dto.solution.SolutionGitPullRequestDto;
import ru.urfu.backend.dto.solution.SolutionManualCodeRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.exception.globalEx.InvalidException;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.SolutionUploadType;
import ru.urfu.backend.repository.SolutionGitPullRequestRepository;
import ru.urfu.backend.repository.SolutionFileRepository;
import ru.urfu.backend.repository.SolutionManualTextRepository;
import ru.urfu.backend.repository.SolutionRepository;
import ru.urfu.backend.service.GithubClient;
import ru.urfu.backend.service.SolutionService;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class SolutionServiceImpl implements SolutionService {

    private static final int MAX_FILES = 100;
    private static final long MAX_FILE_BYTES = 1_000_000;
    private static final long MAX_TOTAL_BYTES = 5_000_000;
    private static final long MAX_ARCHIVE_BYTES = 10_000_000;

    private final SolutionRepository solutionRepository;
    private final SolutionManualTextRepository solutionManualTextRepository;
    private final SolutionGitPullRequestRepository solutionGitPullRequestRepository;
    private final SolutionFileRepository solutionFileRepository;
    private final GithubClient githubClient;

    @Autowired
    public SolutionServiceImpl(
            SolutionRepository solutionRepository,
            SolutionManualTextRepository solutionManualTextRepository,
            SolutionGitPullRequestRepository solutionGitPullRequestRepository,
            SolutionFileRepository solutionFileRepository,
            GithubClient githubClient
    ) {
        this.solutionRepository = solutionRepository;
        this.solutionManualTextRepository = solutionManualTextRepository;
        this.solutionGitPullRequestRepository = solutionGitPullRequestRepository;
        this.solutionFileRepository = solutionFileRepository;
        this.githubClient = githubClient;
    }

    @Transactional(readOnly = true)
    @Override
    public Solution getById(Long id) {
        return solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solution с id=%s не найдено".formatted(id)));
    }

    @Transactional
    @Override
    public Solution createSolutionForGitPullRequest(SolutionSubmitRequest request, Task task) throws Exception {
        Solution solution = new Solution();
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setTask(task);
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());
        solutionRepository.save(solution);

        createSolutionGitPullRequest(resolveGitRequest(request), solution);
        return solution;
    }

    @Transactional
    @Override
    public Solution updateSolutionGitPullRequest(
            SolutionSubmitRequest request,
            Solution solution
    ) throws Exception {
        solution.setRevealAuthorAfterReview(
                request.revealAuthorAfterReview()
        );
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());

        SolutionGitPullRequestDto dto = resolveGitRequest(request).git();

        SolutionGitPullRequest pr =
                solution.getSolutionGitPullRequest();

        if (pr == null) {
            pr = new SolutionGitPullRequest();
            pr.setSolution(solution);
            solution.setSolutionGitPullRequest(pr);
        }

        pr.setRepositoryId(dto.repositoryId());
        pr.setRepositoryName(dto.repositoryName());
        pr.setPullRequestId(dto.pullRequestId());
        pr.setPullRequestNumber(dto.pullRequestNumber());
        pr.setSourceBranch(dto.sourceBranch());
        pr.setTargetBranch(dto.targetBranch());
        pr.setUrl(dto.url());

        solutionGitPullRequestRepository.save(pr);

        return solutionRepository.save(solution);
    }

    @Transactional
    public SolutionGitPullRequest createSolutionGitPullRequest(SolutionSubmitRequest request, Solution solution){
        SolutionGitPullRequestDto solutionGitPullRequestDto = request.git();

        SolutionGitPullRequest solutionGitPullRequest = new SolutionGitPullRequest();
        solutionGitPullRequest.setRepositoryId(solutionGitPullRequestDto.repositoryId());
        solutionGitPullRequest.setRepositoryName(solutionGitPullRequestDto.repositoryName());
        solutionGitPullRequest.setPullRequestId(solutionGitPullRequestDto.pullRequestId());
        solutionGitPullRequest.setPullRequestNumber(solutionGitPullRequestDto.pullRequestNumber());
        solutionGitPullRequest.setSourceBranch(solutionGitPullRequestDto.sourceBranch());
        solutionGitPullRequest.setTargetBranch(solutionGitPullRequestDto.targetBranch());
        solutionGitPullRequest.setUrl(solutionGitPullRequestDto.url());
        solutionGitPullRequest.setSolution(solution);

        solution.setSolutionGitPullRequest(solutionGitPullRequest);
        return solutionGitPullRequestRepository.save(solutionGitPullRequest);
    }

    @Transactional
    @Override
    public Solution createStoredFilesSolution(SolutionSubmitRequest request, Task task) throws Exception {
        Solution solution = new Solution();
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setTask(task);
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());
        solutionRepository.save(solution);
        storeFiles(request, solution);
        return solution;
    }

    @Transactional
    @Override
    public Solution updateStoredFilesSolution(SolutionSubmitRequest request, Solution solution) throws Exception {
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());
        solutionFileRepository.deleteAll(solution.getSolutionFiles());
        solution.getSolutionFiles().clear();
        storeFiles(request, solution);
        return solutionRepository.save(solution);
    }

    @Transactional
    @Override
    public Solution createManualTextSolution(SolutionSubmitRequest request, Task task){
        Solution solution = new Solution();
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setTask(task);
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());
        solutionRepository.save(solution);

        createSolutionManualText(request, solution);
        return solution;
    }

    @Transactional
    @Override
    public Solution updateManualTextSolution(SolutionSubmitRequest request, Solution solution) {
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());
        solutionRepository.save(solution);

        if (solution.getSolutionManualText() != null) {
            solutionManualTextRepository.delete(solution.getSolutionManualText());
        }
        createSolutionManualText(request, solution);
        return solution;
    }

    @Transactional
    public SolutionManualText createSolutionManualText(SolutionSubmitRequest request, Solution solution){
        SolutionManualText solutionManualText = new SolutionManualText();
        solutionManualText.setSolution(solution);

        SolutionManualCodeRequest solutionManualCodeRequest = request.manualCode();
        solutionManualText.setContent(solutionManualCodeRequest.content());
        solutionManualText.setFileName(solutionManualCodeRequest.fileName());
        solutionManualText.setLanguage(solutionManualCodeRequest.language());

        solution.setSolutionManualText(solutionManualText);
        return solutionManualTextRepository.save(solutionManualText);
    }

    @Transactional
    @Override
    public Solution revealAuthor(Solution solution, RevealAuthorAfterReviewRequest request) {
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        return solutionRepository.save(solution);
    }

    @Transactional
    @Override
    public Solution updateUploadedAtSolution(Solution solution){
        solution.setUploadedAt(LocalDateTime.now());
        return solutionRepository.save(solution);
    }

    private SolutionSubmitRequest resolveGitRequest(SolutionSubmitRequest request) throws InvalidException {
        SolutionGitPullRequestDto git = request.git();
        if (git == null) {
            throw new InvalidException("Данные GitHub pull request не переданы");
        }

        if (git.url() == null || git.url().isBlank() || "-".equals(git.url())) {
            return request;
        }

        SolutionGitPullRequestDto resolved = githubClient.resolvePullRequest(git.url());
        return new SolutionSubmitRequest(
                request.taskId(),
                request.uploadType(),
                request.revealAuthorAfterReview(),
                request.manualCode(),
                request.files(),
                request.archive(),
                resolved
        );
    }

    private void storeFiles(SolutionSubmitRequest request, Solution solution) throws Exception {
        List<SolutionFile> files;
        if (SolutionUploadType.FILES.equals(request.uploadType())) {
            files = decodeFiles(request.files(), solution);
        } else if (SolutionUploadType.ARCHIVE.equals(request.uploadType())) {
            files = unzipFiles(request.archive(), solution);
        } else {
            throw new InvalidException("Неподдерживаемый тип файлового решения");
        }

        for (SolutionFile file : files) {
            solution.getSolutionFiles().add(solutionFileRepository.save(file));
        }
    }

    private List<SolutionFile> decodeFiles(List<SolutionFileRequest> requests, Solution solution) throws InvalidException {
        if (requests == null || requests.isEmpty() || requests.size() > MAX_FILES) {
            throw new InvalidException("Отправьте от 1 до 100 файлов");
        }

        List<SolutionFile> files = new ArrayList<>();
        long totalBytes = 0;
        for (SolutionFileRequest request : requests) {
            byte[] content = decodeBase64(request.contentBase64(), MAX_FILE_BYTES);
            if (isBinaryContent(content)) {
                throw new InvalidException("Бинарные файлы не поддерживаются для текстовых решений: " + request.path());
            }
            totalBytes += content.length;
            if (totalBytes > MAX_TOTAL_BYTES) {
                throw new InvalidException("Общий размер файлов превышает 5 МБ");
            }
            files.add(toSolutionFile(request.path(), request.language(), content, solution));
        }
        return files;
    }

    private List<SolutionFile> unzipFiles(SolutionArchiveRequest archive, Solution solution) throws Exception {
        if (archive == null || archive.fileName() == null || !archive.fileName().toLowerCase().endsWith(".zip")) {
            throw new InvalidException("Поддерживаются только ZIP-архивы");
        }

        byte[] archiveBytes = decodeBase64(archive.contentBase64(), MAX_ARCHIVE_BYTES);
        List<SolutionFile> files = new ArrayList<>();
        long totalBytes = 0;
        try (ZipInputStream stream = new ZipInputStream(new ByteArrayInputStream(archiveBytes))) {
            ZipEntry entry;
            while ((entry = stream.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                String name = entry.getName();
                if (isIgnoredFile(name)) {
                    continue;
                }
                byte[] content = readBoundedEntry(stream);
                if (isBinaryContent(content)) {
                    continue;
                }
                if (files.size() >= MAX_FILES) {
                    throw new InvalidException("Архив содержит больше 100 файлов");
                }
                totalBytes += content.length;
                if (totalBytes > MAX_TOTAL_BYTES) {
                    throw new InvalidException("Распакованные файлы превышают 5 МБ");
                }
                files.add(toSolutionFile(name, null, content, solution));
            }
        } catch (IOException exception) {
            throw new InvalidException("Не удалось прочитать ZIP-архив");
        }

        if (files.isEmpty()) {
            throw new InvalidException("ZIP-архив не содержит файлов");
        }
        return files;
    }

    private boolean isIgnoredFile(String path) {
        if (path == null || path.isBlank()) {
            return true;
        }
        String normalized = path.replace('\\', '/');
        if (normalized.contains("__MACOSX/")) {
            return true;
        }
        String fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
        if (".DS_Store".equalsIgnoreCase(fileName)) {
            return true;
        }
        return false;
    }

    private boolean isBinaryContent(byte[] bytes) {
        for (byte b : bytes) {
            if (b == 0) {
                return true;
            }
        }
        return false;
    }

    private byte[] decodeBase64(String contentBase64, long maximumBytes) throws InvalidException {
        if (contentBase64 == null || contentBase64.isBlank()) {
            throw new InvalidException("Содержимое файла отсутствует");
        }

        byte[] content;
        try {
            content = Base64.getDecoder().decode(contentBase64);
        } catch (IllegalArgumentException exception) {
            throw new InvalidException("Некорректное содержимое файла");
        }
        if (content.length > maximumBytes) {
            throw new InvalidException("Файл превышает допустимый размер");
        }
        return content;
    }

    private byte[] readBoundedEntry(ZipInputStream stream) throws IOException, InvalidException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = stream.read(buffer)) > -1) {
            output.write(buffer, 0, read);
            if (output.size() > MAX_FILE_BYTES) {
                throw new InvalidException("Файл в архиве превышает 1 МБ");
            }
        }
        return output.toByteArray();
    }

    private SolutionFile toSolutionFile(String rawPath, String language, byte[] bytes, Solution solution)
            throws InvalidException {
        String path = normalizePath(rawPath);
        SolutionFile file = new SolutionFile();
        file.setPath(path);
        file.setLanguage(language == null || language.isBlank() ? extractLanguage(path) : language);
        file.setSizeBytes((long) bytes.length);
        file.setContent(new String(bytes, StandardCharsets.UTF_8));
        file.setSolution(solution);
        return file;
    }

    private String normalizePath(String rawPath) throws InvalidException {
        if (rawPath == null || rawPath.isBlank()) {
            throw new InvalidException("Путь файла не указан");
        }
        String path = rawPath.replace('\\', '/');
        if (path.startsWith("/") || path.matches("^[A-Za-z]:.*")) {
            throw new InvalidException("Абсолютные пути файлов запрещены");
        }
        for (String segment : path.split("/")) {
            if ("..".equals(segment)) {
                throw new InvalidException("Путь файла выходит за пределы решения");
            }
        }
        return path;
    }

    private String extractLanguage(String path) {
        int dotIndex = path.lastIndexOf('.');
        return dotIndex < 0 ? "plaintext" : path.substring(dotIndex + 1);
    }
}

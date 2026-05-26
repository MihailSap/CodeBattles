package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.SolutionGitPullRequestDto;
import ru.urfu.backend.dto.solution.SolutionManualCodeRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.model.*;
import ru.urfu.backend.repository.SolutionGitPullRequestRepository;
import ru.urfu.backend.repository.SolutionManualTextRepository;
import ru.urfu.backend.repository.SolutionRepository;
import ru.urfu.backend.service.SolutionService;

import java.time.LocalDateTime;
import java.util.Set;

@Service
public class SolutionServiceImpl implements SolutionService {

    private final SolutionRepository solutionRepository;
    private final SolutionManualTextRepository solutionManualTextRepository;
    private final SolutionGitPullRequestRepository solutionGitPullRequestRepository;

    @Autowired
    public SolutionServiceImpl(SolutionRepository solutionRepository, SolutionManualTextRepository solutionManualTextRepository, SolutionGitPullRequestRepository solutionGitPullRequestRepository) {
        this.solutionRepository = solutionRepository;
        this.solutionManualTextRepository = solutionManualTextRepository;
        this.solutionGitPullRequestRepository = solutionGitPullRequestRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Solution getById(Long id) {
        return solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solution с id=%s не найдено".formatted(id)));
    }

    @Transactional
    @Override
    public Solution createSolutionForGitPullRequest(SolutionSubmitRequest request, Task task){
        Solution solution = new Solution();
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setTask(task);
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());
        solutionRepository.save(solution);

        createSolutionGitPullRequest(request, solution);
        return solution;
    }

    @Transactional
    @Override
    public Solution updateSolutionGitPullRequest(
            SolutionSubmitRequest request,
            Solution solution
    ) {
        solution.setRevealAuthorAfterReview(
                request.revealAuthorAfterReview()
        );
        solution.setUploadType(request.uploadType());
        solution.setUploadedAt(LocalDateTime.now());

        SolutionGitPullRequestDto dto = request.git();

        SolutionGitPullRequest pr =
                solution.getSolutionGitPullRequest();

        if (pr == null) {
            pr = new SolutionGitPullRequest();
            pr.setSolution(solution);
            solution.setSolutionGitPullRequest(pr);
        }

        pr.setProvider(dto.provider());
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
        solutionGitPullRequest.setProvider(solutionGitPullRequestDto.provider());
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

        solutionManualTextRepository.delete(solution.getSolutionManualText());
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
}

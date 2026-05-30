package ru.urfu.backend.service;

import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.model.Solution;
import ru.urfu.backend.model.Task;

public interface SolutionService {

    Solution getById(Long id);

    Solution updateUploadedAtSolution(Solution solution);

    Solution revealAuthor(Solution solution, RevealAuthorAfterReviewRequest request);

    Solution createManualTextSolution(SolutionSubmitRequest request, Task task);

    Solution createSolutionForGitPullRequest(SolutionSubmitRequest request, Task task) throws Exception;

    Solution createStoredFilesSolution(SolutionSubmitRequest request, Task task) throws Exception;

    Solution updateManualTextSolution(SolutionSubmitRequest request, Solution solution);

    Solution updateSolutionGitPullRequest(SolutionSubmitRequest request, Solution solution) throws Exception;

    Solution updateStoredFilesSolution(SolutionSubmitRequest request, Solution solution) throws Exception;
}

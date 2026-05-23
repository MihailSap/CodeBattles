package ru.urfu.backend.service;

import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.model.Solution;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;

public interface SolutionService {

    Solution getById(Long id);

    Solution updateUploadedAtSolution(Solution solution);

    Solution revealAuthor(Solution solution, RevealAuthorAfterReviewRequest request);

    Solution createManualTextSolution(SolutionSubmitRequest request, Task task);

    Solution updateManualTextSolution(SolutionSubmitRequest request, Solution solution);
}

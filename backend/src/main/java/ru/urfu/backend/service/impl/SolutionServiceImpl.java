package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.SolutionManualCodeRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.model.Solution;
import ru.urfu.backend.model.SolutionManualText;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.repository.SolutionManualTextRepository;
import ru.urfu.backend.repository.SolutionRepository;
import ru.urfu.backend.service.SolutionService;

import java.util.Set;

@Service
public class SolutionServiceImpl implements SolutionService {

    private final SolutionRepository solutionRepository;
    private final SolutionManualTextRepository solutionManualTextRepository;

    @Autowired
    public SolutionServiceImpl(SolutionRepository solutionRepository, SolutionManualTextRepository solutionManualTextRepository) {
        this.solutionRepository = solutionRepository;
        this.solutionManualTextRepository = solutionManualTextRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Solution getById(Long id) {
        return solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solution с id=%s не найдено".formatted(id)));
    }

    @Transactional
    @Override
    public Solution createManualTextSolution(SolutionSubmitRequest request, User user, Task task){
        Solution solution = new Solution();
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setTask(task);
        solution.setUploadType(request.uploadType());
        solutionRepository.save(solution);

        createSolutionManualText(request, solution);

        //TODO: Удалить
        return solutionRepository.save(solution);
    }

    @Transactional
    @Override
    public Solution updateManualTextSolution(SolutionSubmitRequest request, Solution solution) {
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        solution.setUploadType(request.uploadType());
        solutionRepository.save(solution);

        solutionManualTextRepository.delete(solution.getSolutionManualText());
        createSolutionManualText(request, solution);

        //TODO: Удалить
        return solutionRepository.save(solution);
    }

    @Transactional
    public SolutionManualText createSolutionManualText(SolutionSubmitRequest request, Solution solution){
        SolutionManualText solutionManualText = new SolutionManualText();
        solutionManualText.setSolution(solution);

        SolutionManualCodeRequest solutionManualCodeRequest = request.manualCode();
        solutionManualText.setContent(solutionManualCodeRequest.content());
        solutionManualText.setFileName(solutionManualCodeRequest.fileName());
        solutionManualText.setLanguage(solutionManualCodeRequest.language());
        return solutionManualTextRepository.save(solutionManualText);
    }

    @Transactional
    @Override
    public Solution revealAuthor(Solution solution, RevealAuthorAfterReviewRequest request) {
        solution.setRevealAuthorAfterReview(request.revealAuthorAfterReview());
        return solutionRepository.save(solution);
    }
}

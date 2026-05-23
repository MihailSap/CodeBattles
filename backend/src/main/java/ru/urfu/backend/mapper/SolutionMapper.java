package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewResponse;
import ru.urfu.backend.dto.solution.SolutionSubmitResponse;
import ru.urfu.backend.model.Solution;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.enums.ReviewStatus;

@Component
public class SolutionMapper {

    public SolutionSubmitResponse mapToSolutionSubmitResponse(
            Solution solution, ReviewStatus reviewStatus, String deadline){
        Task task = solution.getTask();
        return new SolutionSubmitResponse(
                task.getId(),
                task.getStatus(),
                reviewStatus,
                solution.getUploadedAt().toString(),
                deadline
        );
    }

    public RevealAuthorAfterReviewResponse mapToRevealAuthorAfterReviewResponse(Solution solution){
        return new RevealAuthorAfterReviewResponse(
                solution.getTask().getId(),
                solution.getRevealAuthorAfterReview()
        );
    }
}

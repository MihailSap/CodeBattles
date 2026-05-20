package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewResponse;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.SolutionUploadType;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.model.enums.UserTaskType;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.ReviewService;
import ru.urfu.backend.service.SolutionService;
import ru.urfu.backend.service.TaskService;

import java.time.LocalDateTime;
import java.util.Set;

@Tag(name = "Управление решениями заданий")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.SOLUTIONS)
public class SolutionController {

    private final AuthService authService;
    private final TaskService taskService;
    private final SolutionService solutionService;
    private final ReviewService reviewService;

    @Autowired
    public SolutionController(
            AuthService authService,
            TaskService taskService,
            SolutionService solutionService,
            ReviewService reviewService
    ) {
        this.authService = authService;
        this.taskService = taskService;
        this.solutionService = solutionService;
        this.reviewService = reviewService;
    }

    @Operation(description = "Первичная отправка решения")
    @PostMapping
    public ResponseEntity<SolutionSubmitResponse> submitSolution(
            @ModelAttribute SolutionSubmitRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(request.taskId());
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new RuntimeException("Пользователь не является исполнителем данной задачи");
        }
        if(!TaskStatus.IN_PROGRESS.equals(task.getStatus())){
            throw new RuntimeException("Задача не находится в статусе IN_PROGRESS");
        }
        if(SolutionUploadType.MANUAL_TEXT.equals(request.uploadType())){
            Solution solution = solutionService.createManualTextSolution(request, user, task);
            for(UserTask userTask : task.getUsers()){
                if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                    reviewService.create(userTask.getUser(), solution);
                }
            }
            Task updatedTask = taskService.updateStatusInReview(task);
            SolutionSubmitResponse response = new SolutionSubmitResponse(
                    updatedTask.getId(),
                    updatedTask.getStatus(),
                    ReviewStatus.NEW,
                    solution.getUploadedAt().toString(),
                    LocalDateTime.now().plusDays(14).toString()
            );
            return ResponseEntity.status(201).body(response);
        } else {
            //TODO: Реализовать работу с другими solution
            throw new RuntimeException("Этот тип данных ещё не поддерживается");
        }
    }

    @Operation(description = "Повторная отправка решения после доработки")
    @PostMapping("/resubmit")
    public SolutionSubmitResponse resubmit(
            @ModelAttribute SolutionSubmitRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(request.taskId());
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new RuntimeException("Пользователь не является исполнителем данной задачи");
        }
        if(!TaskStatus.REWORK.equals(task.getStatus())){
            throw new RuntimeException("Задача не находится в статусе REWORK");
        }

        Solution solution = task.getSolution();
        if(SolutionUploadType.MANUAL_TEXT.equals(request.uploadType())){
            Solution updatedSolution = solutionService.updateManualTextSolution(request, solution);
            if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
                taskService.updateStatusInReview(task);
            }
            return new SolutionSubmitResponse(
                    task.getId(),
                    task.getStatus(),
                    ReviewStatus.IN_PROGRESS,
                    updatedSolution.getUploadedAt().toString(),
                    LocalDateTime.now().plusDays(14).toString()
            );
        } else {
            //TODO: Реализовать работу с другими solution
            throw new RuntimeException("Такой тип данных ещё не поддерживается");
        }
    }

    @Operation(description = "Обновление флага раскрытия имени автора во время ожидания")
    @PatchMapping("/author-visibility")
    public RevealAuthorAfterReviewResponse revealAuthorAfterReview(
            @RequestBody RevealAuthorAfterReviewRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Solution solution = solutionService.getById(request.solutionId());
        Task task = solution.getTask();
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new RuntimeException("Пользователь не является исполнителем данной задачи");
        }
        if(!TaskStatus.IN_REVIEW.equals(task.getStatus())
                && !TaskStatus.REWORK.equals(task.getStatus())){
            throw new RuntimeException("Задача должна находиться в статусе IN_REVIEW или REWORK");
        }
        Solution updatedSolution = solutionService.revealAuthor(solution, request);
        return new RevealAuthorAfterReviewResponse(
                updatedSolution.getTask().getId(),
                updatedSolution.getRevealAuthorAfterReview()
        );
    }
}

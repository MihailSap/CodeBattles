package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.review.ReviewResendRequest;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewResponse;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.SolutionMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.*;
import ru.urfu.backend.service.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Управление решениями задач")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.SOLUTIONS)
public class SolutionController {

    private final AuthService authService;
    private final UserService userService;
    private final TaskService taskService;
    private final SolutionService solutionService;
    private final ReviewService reviewService;
    private final SolutionMapper solutionMapper;

    @Autowired
    public SolutionController(
            AuthService authService,
            UserService userService,
            TaskService taskService,
            SolutionService solutionService,
            ReviewService reviewService,
            SolutionMapper solutionMapper
    ) {
        this.authService = authService;
        this.userService = userService;
        this.taskService = taskService;
        this.solutionService = solutionService;
        this.reviewService = reviewService;
        this.solutionMapper = solutionMapper;
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
        if(task.getSolution() != null){
            throw new RuntimeException("Для данной задачи уже создано решение");
        }
        if(SolutionUploadType.MANUAL_TEXT.equals(request.uploadType())){
            Solution solution = solutionService.createManualTextSolution(request, task);
            int reviewerIndex = 1;
            for(UserTask userTask : task.getUsers()){
                if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                    reviewService.create(userTask.getUser(), solution, reviewerIndex);
                    reviewerIndex++;
                }
            }
            taskService.updateStatusInReview(task);
            return ResponseEntity.status(201).body(
                    solutionMapper.mapToSolutionSubmitResponse(
                            solution, ReviewStatus.NEW, solution.getUploadedAt().plusDays(14).toString()));
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
            for(Review review : updatedSolution.getReviews()){
                ReviewIteration previousIteration =
                        review.getLastIteration();

                ReviewIteration currentIteration =
                        reviewService.createReviewIteration(review);

                reviewService.createReviewFileContent(
                        previousIteration,
                        currentIteration,
                        updatedSolution.getSolutionManualText());
            }
            return solutionMapper.mapToSolutionSubmitResponse(
                    updatedSolution, ReviewStatus.IN_PROGRESS,
                    updatedSolution.getUploadedAt().plusDays(14).toString());
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
        return solutionMapper.mapToRevealAuthorAfterReviewResponse(updatedSolution);
    }

    @Operation(description = "Ручная отправка задачи на ревью")
    @PostMapping("/resend")
    public ResponseEntity<SolutionSubmitResponse> resend(
            @RequestBody ReviewResendRequest request
    ) throws UserNotFoundException {
        Long taskId = request.taskId();
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Solution solution = task.getSolution();
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new RuntimeException("403 FORBIDDEN_TASK");
        }
        if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
            throw new RuntimeException("Задача должна находиться в статусе IN_REVIEW");
        }
        if(!ReviewType.MANUAL_ASSIGNEES.equals(task.getReviewType())){
            throw new RuntimeException("Задача должна иметь тип ревью MANUAL_ASSIGNEES");
        }
        if(request.reviewerIds().isEmpty()){
            throw new RuntimeException("Список ревьюеров пуст");
        }

        for(Review review : task.getReviews()){
            ReviewIteration reviewIteration = review.getLastIteration();
            if(reviewIteration == null || reviewIteration.getDeadline() == null){
                throw new RuntimeException("Некорректные данные ревью");
            }
            if(reviewIteration.getReviewVerdict() != null){
                throw new RuntimeException("Найдено итоговое ревью на задачу, ручная отправка невозможна");
            }
            if(!reviewIteration.getDeadline().isBefore(LocalDateTime.now())){
                throw new RuntimeException("Дедлайн по ревью ещё не истёк");
            }
        }

        List<User> reviewers = new ArrayList<>();
        for(Long reviewerId : request.reviewerIds()){
            reviewers.add(userService.getById(reviewerId));
        }

        List<Review> reviews = reviewService.create(reviewers, solution);

        return ResponseEntity.status(201).body(
                solutionMapper.mapToSolutionSubmitResponse(solution, ReviewStatus.NEW,
                        reviews.get(0).getLastIteration().getDeadline().toString()));
    }
}

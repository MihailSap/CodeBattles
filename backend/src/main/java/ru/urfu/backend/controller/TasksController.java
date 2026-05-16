package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.solution.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.TaskService;

@Tag(name = "Управление заданиями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.TASKS)
public class TasksController {

    private final TaskService taskService;
    private final AuthService authService;

    @Autowired
    public TasksController(TaskService taskService, AuthService authService) {
        this.taskService = taskService;
        this.authService = authService;
    }

//    @Operation(description = "Отправка решения задачи")
//    @PostMapping("/{taskId}/solution")
//    public SolutionSubmitResponse sendSolution(
//            @PathVariable("taskId") Long taskId, @ModelAttribute SolutionSubmitRequest request
//    ) throws UserNotFoundException {
//        Task task = taskService.getById(taskId);
//        User user = authService.getAuthenticatedUser();
//
//        if(!taskService.isUserAssigneeInTask(user, task)) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//
//        if(!TaskStatus.IN_PROGRESS.equals(task.getStatus())) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//    }
//
//    @Operation(description = "Отправка решения задачи")
//    @PostMapping("/{taskId}/solution/resubmit")
//    public SolutionSubmitResponse resubmitSolution(
//            @PathVariable("taskId") Long taskId, @ModelAttribute SolutionSubmitRequest request
//    ) throws UserNotFoundException {
//        Task task = taskService.getById(taskId);
//        User user = authService.getAuthenticatedUser();
//
//        if(!taskService.isUserAssigneeInTask(user, task)) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//
//        if(!TaskStatus.REWORK.equals(task.getStatus())) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//    }
//
//    @Operation(description = "Обновление флага раскрытия имени автора во время ожидания")
//    @PostMapping("/{taskId}/solution/author-visibility")
//    public RevealAuthorAfterReviewResponse revealAuthor(
//            @PathVariable("taskId") Long taskId, @RequestBody RevealAuthorAfterReviewRequest request
//    ) throws UserNotFoundException {
//        Task task = taskService.getById(taskId);
//        User user = authService.getAuthenticatedUser();
//
//        if(!taskService.isUserAssigneeInTask(user, task)) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//
//        if(!TaskStatus.REWORK.equals(task.getStatus())
//            || !TaskStatus.IN_REVIEW.equals(task.getStatus())) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//    }
//
//    @Operation(description = "Завершение одобренного ревью")
//    @PostMapping("/{taskId}/review/finish")
//    public ReviewFinishResponse reviewFinish(
//            @PathVariable("taskId") Long taskId
//    ) throws UserNotFoundException {
//        Task task = taskService.getById(taskId);
//        User user = authService.getAuthenticatedUser();
//
//        if(!taskService.isUserAssigneeInTask(user, task)) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//
//        if(!TaskStatus.REWORK.equals(task.getStatus())
//                || !TaskStatus.IN_REVIEW.equals(task.getStatus())) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//    }
//
//    @Operation(description = "Завершение одобренного ревью")
//    @PostMapping("/{taskId}/review/resend")
//    public SolutionSubmitResponse reviewResend(
//            @PathVariable("taskId") Long taskId, @RequestBody ReviewResendRequest request
//    ) throws UserNotFoundException {
//        Task task = taskService.getById(taskId);
//        User user = authService.getAuthenticatedUser();
//
//        if(!taskService.isUserAssigneeInTask(user, task)) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//
//        if(!TaskStatus.REWORK.equals(task.getStatus())
//                || !TaskStatus.IN_REVIEW.equals(task.getStatus())) {
//            throw new RuntimeException(""); //FIXME: Возвращать нужную ошибку
//        }
//    }
}

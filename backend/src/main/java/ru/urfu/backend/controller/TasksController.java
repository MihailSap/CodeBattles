package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.DeletedResponse;
import ru.urfu.backend.dto.tasks.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.TaskMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.ReviewVerdictType;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.service.*;

import java.util.ArrayList;
import java.util.List;

@Tag(name = "Управление задачами")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.TASKS)
public class TasksController {

    private final AuthService authService;
    private final ProjectService projectService;
    private final TaskService taskService;
    private final TaskMapper taskMapper;

    @Autowired
    public TasksController(
            TaskService taskService,
            AuthService authService,
            ProjectService projectService,
            TaskMapper taskMapper
    ) {
        this.taskService = taskService;
        this.authService = authService;
        this.projectService = projectService;
        this.taskMapper = taskMapper;
    }

    @Operation(description = "Создание задачи")
    @PostMapping
    public ResponseEntity<TaskDetailsResponse> createTask(
            @RequestBody CreateTaskRequest requestDto
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(requestDto.projectId());
        if(!projectService.isUserOwnerInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }
        Task task = taskService.create(requestDto, project);
        return ResponseEntity.status(201).body(taskMapper.mapToTaskDetailsResponse(task));
    }

    @Operation(description = "Получение задач проекта")
    @GetMapping("/by-project/{projectId}")
    public List<TaskListItemResponse> getProjectTasks(
            @PathVariable("projectId") Long projectId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);
        if(!projectService.isUserOwnerInProject(project, user)
                && !projectService.isUserMemberInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        List<TaskListItemResponse> taskListItemResponses = new ArrayList<>();
        for(Task task : project.getTasks()){
            TaskListItemResponse taskListItemResponse = taskMapper.mapToTaskListItemResponse(task);
            taskListItemResponses.add(taskListItemResponse);
        }
        return taskListItemResponses;
    }

    @Operation(description = "Получение деталей задачи")
    @GetMapping("/{taskId}")
    public TaskDetailsResponse getTask(
            @PathVariable("taskId") Long taskId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Project project = task.getProject();
        if(!projectService.isUserOwnerInProject(project, user)
                && !taskService.isUserReviewerInTask(user, task)
                && !taskService.isUserAssigneeInTask(user, task)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }
        return taskMapper.mapToTaskDetailsResponse(task);
    }

    @Operation(description = "Обновление настроек задачи")
    @PatchMapping("/{taskId}")
    public TaskDetailsResponse updateTask(
            @PathVariable("taskId") Long taskId,
            @RequestBody UpdateTaskSettingsRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Project project = task.getProject();
        if(!projectService.isUserOwnerInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        Task updatedTask = taskService.update(task, request);
        return taskMapper.mapToTaskDetailsResponse(updatedTask);
    }

    @Operation(description = "Удаление задачи")
    @DeleteMapping("/{taskId}")
    public DeletedResponse deleteTask(
            @PathVariable("taskId") Long taskId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Project project = task.getProject();
        if(!projectService.isUserOwnerInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }
        taskService.delete(task);
        return new DeletedResponse(true);
    }

    @Operation(description = "Завершение задачи")
    @PostMapping("/{taskId}/done")
    public TaskDoneResponse completeTask(
            @PathVariable("taskId") Long taskId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new RuntimeException("Только исполнитель может завершать задачу");
        }
        if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
            throw new RuntimeException("Запрещено завершать задачи в статусе, отличном от IN_REVIEW");
        }

        List<Long> reviewIds = new ArrayList<>();
        for(Review review : task.getReviews()){
            ReviewVerdict reviewVerdict = review.getLastIteration().getReviewVerdict();
            if(reviewVerdict == null || !ReviewVerdictType.APPROVED.equals(reviewVerdict.getVerdict())){
                throw new RuntimeException("Задача ещё не прошла все ревью");
            }
            reviewIds.add(review.getId());
        }

        Task updatedTask = taskService.updateStatusDone(task);
        return taskMapper.mapToTaskDoneResponse(updatedTask, reviewIds);
    }
}

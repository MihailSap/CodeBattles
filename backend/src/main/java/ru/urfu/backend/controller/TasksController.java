package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.DeletedResponse;
import ru.urfu.backend.dto.tasks.CreateTaskRequest;
import ru.urfu.backend.dto.tasks.TaskDetailsResponse;
import ru.urfu.backend.dto.tasks.TaskListItemResponse;
import ru.urfu.backend.dto.tasks.UpdateTaskSettingsRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.TaskMapper;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.TaskService;

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
    @PostMapping("/tasks")
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
    @GetMapping("/tasks/by-project/{projectId}")
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
    @GetMapping("/tasks/{taskId}")
    public TaskDetailsResponse getTask(
            @PathVariable("taskId") Long taskId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Project project = task.getProject();
        if(!projectService.isUserOwnerInProject(project, user)
                && !taskService.isUserReviewerInTask(user, task)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }
        return taskMapper.mapToTaskDetailsResponse(task);
    }

    @Operation(description = "Обновление настроек задачи")
    @PatchMapping("/tasks/{taskId}")
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
    @DeleteMapping("/tasks/{taskId}")
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
}

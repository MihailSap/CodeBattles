package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.CreatedResponse;
import ru.urfu.backend.dto.tasks.TaskCreateRequest;
import ru.urfu.backend.dto.tasks.TaskResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.TaskMapper;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.TaskService;

import java.util.List;

@Tag(name = "Управление задачами")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.TASKS)
public class TaskController {

    private final ProjectService projectService;
    private final TaskService taskService;
    private final TaskMapper taskMapper;

    @Autowired
    public TaskController(ProjectService projectService, TaskService taskService, TaskMapper taskMapper) {
        this.projectService = projectService;
        this.taskService = taskService;
        this.taskMapper = taskMapper;
    }

    @Operation(description = "Получение задачи по id")
    @GetMapping("/{taskId}")
    public TaskResponse getById(@PathVariable("taskId") Long taskId){
        Task task = taskService.getById(taskId);
        return taskMapper.mapToTaskResponse(task);
    }

    @Operation(description = "Получение задач по projectId")
    @GetMapping("/by-project/{projectId}")
    public List<TaskResponse> getByProject(@PathVariable("projectId") Long projectId){
        Project project = projectService.getById(projectId);
        List<Task> tasks = taskService.getByProject(project);
        return taskMapper.mapToTaskResponseList(tasks);
    }

    @Operation(description = "Создание задачи для проекта")
    @PostMapping("/create-by-project/{projectId}")
    public ResponseEntity<CreatedResponse> create(
            @PathVariable("projectId") Long projectId, @RequestBody TaskCreateRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        Task task = taskService.create(request, project);
        return ResponseEntity.status(201).body(new CreatedResponse(task.getId()));
    }
}

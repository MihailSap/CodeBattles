package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.dashboard.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.DashboardMapper;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.ReviewService;
import ru.urfu.backend.service.TaskService;

import java.util.List;

@Tag(name = "Дашборд")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.DASHBOARD)
public class DashboardController {

    private final AuthService authService;
    private final TaskService taskService;
    private final ProjectService projectService;
    private final ReviewService reviewService;
    private final DashboardMapper dashboardMapper;

    @Autowired
    public DashboardController(
            AuthService authService,
            TaskService taskService,
            ProjectService projectService,
            ReviewService reviewService,
            DashboardMapper dashboardMapper
    ) {
        this.authService = authService;
        this.taskService = taskService;
        this.projectService = projectService;
        this.reviewService = reviewService;
        this.dashboardMapper = dashboardMapper;
    }

    @Operation(description = "Получение задач текущего пользователя")
    @GetMapping("/tasks")
    public DashboardTasksResponseDto getDashboardTasks(
            @RequestParam(required = false) Long projectId,
            @RequestParam(defaultValue = "ALL") DashboardTaskFilterStatus status
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Task> tasks = taskService.getDashboardTasks(user, projectId, status);
        List<DashboardTaskItemDto> items = tasks.stream()
                .map(dashboardMapper::mapToDashboardTaskItemDto)
                .toList();

        return new DashboardTasksResponseDto(items, items.size());
    }

    @Operation(description = "Получение назначенных ревью текущего пользователя")
    @GetMapping("/reviews")
    public DashboardReviewsResponseDto getDashboardReviews(
            @RequestParam(required = false) Long projectId,
            @RequestParam(defaultValue = "ALL") DashboardTaskFilterStatus status
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Review> reviews = reviewService.getDashboardReviews(user, projectId, status);
        List<DashboardReviewItemDto> items = reviews.stream()
                .map(dashboardMapper::mapToDashboardReviewItemDto)
                .toList();

        return new DashboardReviewsResponseDto(items, items.size());
    }

    @Operation(description = "Получение проектов текущего пользователя")
    @GetMapping("/projects")
    public DashboardProjectsResponseDto getDashboardProjects()
            throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Project> projects = projectService.getUserProjects(user);
        List<DashboardProjectFilterItemDto> items = projects.stream()
                .map(dashboardMapper::mapToDashboardProjectFilterItemDto)
                .toList();
        return new DashboardProjectsResponseDto(items);
    }
}

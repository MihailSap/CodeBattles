package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.leaderboard.LeaderBoardResponse;
import ru.urfu.backend.dto.leaderboard.LeaderboardCategory;
import ru.urfu.backend.dto.leaderboard.LeaderboardEntityResponse;
import ru.urfu.backend.dto.leaderboard.LeaderboardPeriod;
import ru.urfu.backend.dto.leaderboard.LeaderboardResetRatingRequest;
import ru.urfu.backend.dto.leaderboard.LeaderboardResetRatingResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.LeaderboardMapper;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.model.enums.Role;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.LeaderboardService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.ProjectService;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Tag(name = "Управление лидербордом")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.LEADERBOARD)
public class LeaderboardController {

    private final AuthService authService;
    private final OrganizationService organizationService;
    private final ProjectService projectService;
    private final LeaderboardMapper leaderboardMapper;
    private final LeaderboardService leaderboardService;

    @Autowired
    public LeaderboardController(
            AuthService authService,
            OrganizationService organizationService,
            ProjectService projectService,
            LeaderboardMapper leaderboardMapper,
            LeaderboardService leaderboardService
    ) {
        this.authService = authService;
        this.organizationService = organizationService;
        this.projectService = projectService;
        this.leaderboardMapper = leaderboardMapper;
        this.leaderboardService = leaderboardService;
    }

    @Operation(description = "Получение глобального лидерборда")
    @GetMapping
    public LeaderBoardResponse getGlobalLeaderboard(
            @RequestParam(value = "period", defaultValue = "ALL_TIME") LeaderboardPeriod period,
            @RequestParam(value = "category", defaultValue = "OVERALL") LeaderboardCategory category,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "100") int size
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return leaderboardService.getGlobalLeaderboard(user, period, category, query, page, size);
    }

    @Operation(description = "Получение лидерборда организации")
    @GetMapping("/organizations/{organizationId}")
    public LeaderBoardResponse getOrganizationLeaderboard(
            @PathVariable("organizationId") Long organizationId,
            @RequestParam(value = "period", defaultValue = "ALL_TIME") LeaderboardPeriod period,
            @RequestParam(value = "category", defaultValue = "OVERALL") LeaderboardCategory category,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "100") int size
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return leaderboardService.getOrganizationLeaderboard(
                user, organizationId, period, category, query, page, size);
    }

    @Operation(description = "Получение лидерборда проекта")
    @GetMapping("/projects/{projectId}")
    public LeaderBoardResponse getProjectLeaderboard(
            @PathVariable("projectId") Long projectId,
            @RequestParam(value = "period", defaultValue = "ALL_TIME") LeaderboardPeriod period,
            @RequestParam(value = "category", defaultValue = "OVERALL") LeaderboardCategory category,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "100") int size
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return leaderboardService.getProjectLeaderboard(user, projectId, period, category, query, page, size);
    }

    @Operation(description = "Получение доступных организаций для лидерборда")
    @GetMapping("/organizations")
    public List<LeaderboardEntityResponse> getOrganizations(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "limit", defaultValue = "5") int limit
    )
            throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Organization> organizations;
        if(Role.ADMIN.equals(user.getRole())){
            organizations = organizationService.getAllOrganizations();
        } else {
            List<UserOrganization> userOrganizations = organizationService.getMyOrganizations(user);
            organizations = leaderboardMapper.extractOrganizations(userOrganizations);
        }

        organizations.sort(Comparator.comparing(Organization::getLastActivityAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return leaderboardMapper.mapOrganizationsToLeaderboardEntityResponses(
                organizations.stream()
                        .filter(organization -> matchesQuery(organization.getTitle(), query))
                        .limit(normalizeLimit(limit))
                        .toList());
    }

    @Operation(description = "Получение доступных проектов для лидерборда")
    @GetMapping("/projects")
    public List<LeaderboardEntityResponse> getProjects(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "limit", defaultValue = "5") int limit
    )
            throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Project> projects;
        if(Role.ADMIN.equals(user.getRole())){
            projects = projectService.getAllProjects();
        } else {
            projects = projectService.getUserProjects(user);
        }

        projects.sort(Comparator.comparing(Project::getLastActivityAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return leaderboardMapper.mapProjectsToLeaderboardEntityResponses(
                projects.stream()
                        .filter(project -> matchesQuery(project.getTitle(), query))
                        .limit(normalizeLimit(limit))
                        .toList());
    }

    @Operation(description = "Обнуление рейтинга пользователя")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/users/{userId}/reset-rating")
    public LeaderboardResetRatingResponse resetUserRating(
            @PathVariable("userId") Long userId,
            @RequestBody(required = false) LeaderboardResetRatingRequest request
    ) throws UserNotFoundException {
        User admin = authService.getAuthenticatedUser();
        String reason = request == null ? null : request.reason();
        return leaderboardService.resetRating(admin, userId, reason);
    }

    private boolean matchesQuery(String value, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }

        return value != null && value.toLowerCase(Locale.ROOT).contains(query.trim().toLowerCase(Locale.ROOT));
    }

    private int normalizeLimit(int limit) {
        return Math.max(1, Math.min(limit, 50));
    }
}

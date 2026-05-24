package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.leaderboard.LeaderboardEntityResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.LeaderboardMapper;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.model.enums.Role;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.UserService;

import java.util.Comparator;
import java.util.List;

@Tag(name = "Управление лидербордом")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.LEADERBOARD)
public class LeaderboardController {

    private final AuthService authService;
    private final OrganizationService organizationService;
    private final ProjectService projectService;
    private final LeaderboardMapper leaderboardMapper;

    @Autowired
    public LeaderboardController(
            AuthService authService,
            OrganizationService organizationService,
            ProjectService projectService,
            LeaderboardMapper leaderboardMapper
    ) {
        this.authService = authService;
        this.organizationService = organizationService;
        this.projectService = projectService;
        this.leaderboardMapper = leaderboardMapper;
    }

//    @Operation(description = "Получение лидерборда организаций")
//    @GetMapping("/organizations/{organizationId}")
//    public LeaderBoardResponse getOrganizationLeaderboard(
//            @PathVariable("organizationId") Long organizationId
//    ) throws UserNotFoundException {
//        User user = authService.getAuthenticatedUser();
//        Organization organization = organizationService.getById(organizationId);
//        if(!Role.ADMIN.equals(user.getRole())
//                && organizationService.isUserExistsInOrganization(organization, user)) {
//            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION_LEADERBOARD");
//        }
//
//    }

    @Operation(description = "Получение доступных организаций для лидерборда")
    @GetMapping("/organizations")
    public List<LeaderboardEntityResponse> getOrganizations()
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
        return leaderboardMapper.mapOrganizationsToLeaderboardEntityResponses(organizations);
    }

    @Operation(description = "Получение доступных проектов для лидерборда")
    @GetMapping("/projects")
    public List<LeaderboardEntityResponse> getProjects()
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
        return leaderboardMapper.mapProjectsToLeaderboardEntityResponses(projects);
    }
}

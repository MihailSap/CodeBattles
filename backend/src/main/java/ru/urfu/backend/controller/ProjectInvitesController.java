package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.invite.ProjectInviteResponse;
import ru.urfu.backend.dto.project.ProjectJoinedResponse;
import ru.urfu.backend.exception.customEx.AlreadyMemberException;
import ru.urfu.backend.exception.customEx.InvalidInviteException;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.ProjectInviteMapper;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.ProjectInvite;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.ProjectInviteService;
import ru.urfu.backend.service.ProjectService;

import java.time.LocalDateTime;

@Tag(name = "Управление заявками на вступление в проект")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.PROJECT_INVITES)
public class ProjectInvitesController {

    private final AuthService authService;
    private final ProjectInviteService projectInviteService;
    private final ProjectInviteMapper projectInviteMapper;
    private final ProjectService projectService;
    private final OrganizationService organizationService;

    @Autowired
    public ProjectInvitesController(AuthService authService, ProjectInviteService projectInviteService, ProjectInviteMapper projectInviteMapper, ProjectService projectService, OrganizationService organizationService) {
        this.authService = authService;
        this.projectInviteService = projectInviteService;
        this.projectInviteMapper = projectInviteMapper;
        this.projectService = projectService;
        this.organizationService = organizationService;
    }

    @Operation(description = "Проверка invite запроса по токену")
    @GetMapping("/{token}")
    public ProjectInviteResponse getInviteByToken(@PathVariable("token") String token){
        ProjectInvite projectInvite = projectInviteService.getByToken(token);
        if(projectInvite.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new InvalidInviteException("400 INVALID_INVITE");
        }
        return projectInviteMapper.mapToProjectInviteResponse(projectInvite);
    }

    @Operation(description = "Вступление в проект по токену")
    @PostMapping("/{token}/join")
    public ProjectJoinedResponse join(@PathVariable("token") String token) throws UserNotFoundException {
        ProjectInvite projectInvite = projectInviteService.getByToken(token);
        Project project = projectInvite.getProject();
        User user = authService.getAuthenticatedUser();
        if(projectService.isUserProjectExists(project, user)){
            throw new AlreadyMemberException("409 ALREADY_MEMBER");
        }
        if(projectInvite.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new InvalidInviteException("400 INVALID_INVITE");
        }

        Organization organization = project.getOrganization();
        if(organization != null && !organizationService.isUserExistsInOrganization(organization, user)){
            organizationService.addUser(organization, user, false);
        }

        projectService.addUserToProject(user, project, ProjectMemberRole.MEMBER);
        return new ProjectJoinedResponse(true, project.getId());
    }
}

package ru.urfu.backend.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.dto.organization.join.OrganizationJoinRequest;
import ru.urfu.backend.dto.project.ProjectItemResponse;
import ru.urfu.backend.dto.project.ProjectListItemDto;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.service.ProjectService;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
public class OrganizationMapper {

    private final ProjectMapper projectMapper;
    private final ProjectService projectService;

    @Autowired
    public OrganizationMapper(ProjectMapper projectMapper, ProjectService projectService) {
        this.projectMapper = projectMapper;
        this.projectService = projectService;
    }

    public OrganizationDetailsResponse mapToOrganizationDetailsDto(User user, Organization organization, String viewerRole) {
        return new OrganizationDetailsResponse(
                organization.getId(),
                organization.getTitle(),
                organization.getDescription(),
                organization.getLink(),
                organization.getAvatarFileTitle(),
                getAdminId(organization),
                viewerRole,
                getParticipants(organization),
                getProjects(user, organization),
                getJoinRequests(organization)
        );
    }

    public OrganizationParticipantResponse mapToOrganizationParticipantResponse(UserOrganization userOrganization){
        User user = userOrganization.getUser();
        return new OrganizationParticipantResponse(
                user.getId(),
                user.getLogin(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarFileTitle(),
                userOrganization.getAdmin() ? "OWNER" : "MEMBER"
        );
    }

    public OrganizationProjectsCardResponse mapToOrganizationProjectsCardDto(
            User user, Organization organization, Boolean isAdmin){
        Set<Project> projects = organization.getProjects();
        List<ProjectListItemDto> projectDetailsDtos = new ArrayList<>();
        for (Project project : projects) {
            Optional<UserProject> userProject = projectService.getOptionalUserProject(user, project);
            if (userProject.isPresent()) {
                projectDetailsDtos.add(projectMapper.mapToProjectListItemDto(
                        project, userProject.get().getProjectMemberRole()));
            }
        }

        return new OrganizationProjectsCardResponse(
                organization.getId(),
                organization.getAvatarFileTitle(),
                organization.getTitle(),
                organization.getLink(),
                organization.getDescription(),
                isAdmin,
                projectDetailsDtos
        );
    }

    public OrganizationListItemResponse mapToOrganizationListItemResponse(
            Organization organization, Boolean isAdmin) {
        return new OrganizationListItemResponse(
                organization.getId(),
                organization.getAvatarFileTitle(),
                organization.getTitle(),
                organization.getLink(),
                organization.getDescription(),
                getMembersCount(organization),
                getProjectsCount(organization),
                isAdmin
        );
    }

    public OrganizationListItemDto mapToOrganizationListItemDto(
            Organization organization, Boolean hasPendingRequest) {
        return new OrganizationListItemDto(
                organization.getId(),
                organization.getAvatarFileTitle(),
                organization.getTitle(),
                organization.getLink(),
                organization.getDescription(),
                getMembersCount(organization),
                getProjectsCount(organization),
                hasPendingRequest
        );
    }

    private List<OrganizationJoinRequest> getJoinRequests(Organization organization) {
        List<OrganizationJoinRequest> joinRequests = new ArrayList<>();
        Set<UserOrganization> userOrganizations = organization.getMembers();
        List<UserOrganization> requests = new ArrayList<>();
        for (UserOrganization userOrganization : userOrganizations) {
            if(Boolean.FALSE.equals(userOrganization.getEnabled())){
                requests.add(userOrganization);
            }
        }

        for (UserOrganization request : requests) {
            joinRequests.add(new OrganizationJoinRequest(
                    request.getId(),
                    request.getUser().getId(),
                    request.getUser().getLogin(),
                    request.getUser().getFullName(),
                    request.getUser().getAvatarFileTitle(),
                    request.getCreatedAt().toString()
            ));
        }
        return joinRequests;
    }

    private Long getAdminId(Organization organization){
        Set<UserOrganization> members = organization.getMembers();
        for(UserOrganization member : members) {
            if(member.getAdmin()){
                return member.getId();
            }
        }
        return null;
    }

    private List<ProjectItemResponse> getProjects(User user, Organization organization){
        List<ProjectItemResponse> projects = new ArrayList<>();
        for(Project project : organization.getProjects()){
            ProjectMemberRole projectMemberRole;
            if(projectService.isUserOwnerInProject(project, user)){
                projectMemberRole = ProjectMemberRole.OWNER;
            } else if(projectService.isUserMemberInProject(project, user)){
                projectMemberRole = ProjectMemberRole.MEMBER;
            } else {
                if(project.getIsPrivate()) continue;
                projectMemberRole = ProjectMemberRole.GUEST;
            }
            projects.add(new ProjectItemResponse(
                    project.getId(),
                    project.getTitle(),
                    project.getDescription(),
                    getActiveTasksCount(project),
                    projectMapper.mapToProjectParticipantDtos(project.getUsers()),
                    projectMemberRole
            ));
        }
        return projects;
    }

    private int getActiveTasksCount(Project project){
        Set<Task> tasks = project.getTasks();
        if(tasks.isEmpty()) return 0;
        int count = 0;
        for(Task task : tasks){
            if(!TaskStatus.DONE.equals(task.getStatus())){
                count++;
            }
        }
        return count;
    }

    private List<OrganizationParticipantResponse> getParticipants(Organization organization) {
        List<OrganizationParticipantResponse> participants = new ArrayList<>();
        for (UserOrganization userOrganization : organization.getMembers()) {
            if(userOrganization.getEnabled()){
                participants.add(mapToOrganizationParticipantResponse(userOrganization));
            }
        }
        return participants;
    }

    private int getMembersCount(Organization organization) {
        if(organization.getMembers() == null) return 0;
        return organization.getMembers().size();
    }

    private int getProjectsCount(Organization organization) {
        if(organization.getProjects() == null) return 0;
        return organization.getProjects().size();
    }
}

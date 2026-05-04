package ru.urfu.backend.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.dto.project.ProjectItemResponse;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class OrganizationMapper {

    private final ProjectMapper projectMapper;

    @Autowired
    public OrganizationMapper(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    public OrganizationDetailsDto mapToOrganizationDetailsDto(Organization organization, String viewerRole) {
        return new OrganizationDetailsDto(
                organization.getId(),
                organization.getTitle(),
                organization.getDescription(),
                organization.getLink(),
                organization.getLogo(),
                getAdminId(organization),
                viewerRole,
                getParticipants(organization),
                getProjects(organization),
                getJoinRequests(organization)
        );
    }

    public List<OrganizationJoinRequest> getJoinRequests(Organization organization) {
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
                    request.getUser().getAvatarUrl(),
                    request.getCreatedAt().toString()
            ));
        }
        return joinRequests;
    }

    public List<OrganizationParticipantResponse> getParticipants(Organization organization) {
        List<OrganizationParticipantResponse> participants = new ArrayList<>();
        for (UserOrganization userOrganization : organization.getMembers()) {
            participants.add(mapToOrganizationParticipantResponse(userOrganization));
        }
        return participants;
    }

    public OrganizationParticipantResponse mapToOrganizationParticipantResponse(UserOrganization userOrganization){
        User user = userOrganization.getUser();
        return new OrganizationParticipantResponse(
                user.getId(),
                user.getLogin(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                userOrganization.getAdmin() ? "OWNER" : "MEMBER"
        );
    }

    public List<ProjectItemResponse> getProjects(Organization organization){
        List<ProjectItemResponse> projects = new ArrayList<>();
        for(Project project : organization.getProjects()){
            projects.add(new ProjectItemResponse(
                    project.getId(),
                    project.getTitle(),
                    project.getDescription(),
                    0, //FIXME
                    projectMapper.mapToProjectParticipantDtos(project.getUsers()),
                    ProjectMemberRole.MEMBER //FIXME
            ));
        }
        return projects;
    }

    public Long getAdminId(Organization organization){
        Set<UserOrganization> members = organization.getMembers();
        for(UserOrganization member : members) {
            if(member.getAdmin()){
                return member.getId();
            }
        }
        return null;
    }

    public List<OrganizationListItemDto> mapToOrganizationListDto(Set<UserOrganization> userOrganizations) {
        List<OrganizationListItemDto> organizationListItemDtos = new ArrayList<>();
        for (UserOrganization organization : userOrganizations) {
            organizationListItemDtos.add(mapToOrganizationListItemDto(organization));
        }
        return organizationListItemDtos;
    }

    public OrganizationListShortItemDto mapToOrganizationListShortItemDto(Organization organization, Boolean hasPendingRequest) {
        return new OrganizationListShortItemDto(
                organization.getId(),
                organization.getLogo(),
                organization.getTitle(),
                organization.getLink(),
                organization.getDescription(),
                getMembersCount(organization),
                getProjectsCount(organization),
                hasPendingRequest
        );
    }

    public OrganizationListItemDto mapToOrganizationListItemDto(UserOrganization userOrganization) {
        Organization organization = userOrganization.getOrganization();
        return new OrganizationListItemDto(
                organization.getId(),
                organization.getLogo(),
                organization.getTitle(),
                organization.getLink(),
                organization.getDescription(),
                getMembersCount(organization),
                getProjectsCount(organization),
                userOrganization.getAdmin(),
                !userOrganization.getEnabled()
        );
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

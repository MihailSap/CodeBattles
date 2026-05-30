package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.project.ProjectDetailsDto;
import ru.urfu.backend.dto.project.ProjectListItemDto;
import ru.urfu.backend.dto.project.ProjectParticipantDto;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class ProjectMapper {

    public List<ProjectParticipantDto> mapToProjectParticipantDtos(Set<UserProject> userProjects) {
        if(userProjects == null) return List.of();
        List<ProjectParticipantDto> projectParticipants = new ArrayList<>();
        for (UserProject userProject : userProjects) {
            ProjectParticipantDto projectParticipantDto = mapToProjectParticipantDto(userProject);
            projectParticipants.add(projectParticipantDto);
        }
        return projectParticipants;
    }

    public ProjectParticipantDto mapToProjectParticipantDto(UserProject userProject) {
        User participant = userProject.getUser();
        return new ProjectParticipantDto(
                participant.getId(),
                participant.getLogin(),
                participant.getEmail(),
                participant.getFullName(),
                participant.getAvatarFileTitle(),
                userProject.getProjectMemberRole()
        );
    }

    public ProjectListItemDto mapToProjectListItemDto(Project project, ProjectMemberRole projectMemberRole){
        Organization organization = project.getOrganization();
        return new ProjectListItemDto(
                project.getId(),
                project.getTitle(),
                project.getDescription(),
                project.getIsPrivate(),
                organization == null ? null : organization.getId(),
                organization == null ? null : organization.getTitle(),
                projectMemberRole,
                getUsersCount(project.getUsers()),
                getTasksCount(project.getTasks()),
                project.getLastActivityAt() == null ? "" : project.getLastActivityAt().toString()
        );
    }

    public ProjectDetailsDto mapToProjectDetailsDto(Project project, ProjectMemberRole projectMemberRole) {
        return new ProjectDetailsDto(
                project.getId(),
                project.getOrganization() == null ? null : project.getOrganization().getId(),
                project.getOrganization() == null ? null : project.getOrganization().getTitle(),
                project.getTitle(),
                project.getDescription(),
                mapStacks(project.getStacks()),
                project.getIsPrivate(),
                project.getAiReviewEnabled(),
                project.getRepositoryUrl(),
                project.getLastActivityAt() == null ? "" : project.getLastActivityAt().toString(),
                projectMemberRole,
                !ProjectMemberRole.GUEST.equals(projectMemberRole),
                mapParticipantsId(project.getUsers()),
                ProjectMemberRole.GUEST.equals(projectMemberRole) ? List.of() : mapTaskIds(project.getTasks())
        );
    }

    private List<String> mapStacks(Set<ProjectStack> stacks) {
        if(stacks == null) return List.of();
        List<String> stackFullResponses = new ArrayList<>();
        for(var stack : stacks) {
            stackFullResponses.add(stack.getStack().getTitle());
        }
        return stackFullResponses;
    }

    private List<Long> mapTaskIds(Set<Task> tasks){
        if(tasks == null) return List.of();
        List<Long> taskIds = new ArrayList<>();
        for(var task : tasks) {
            taskIds.add(task.getId());
        }
        return taskIds;
    }

    private List<Long> mapParticipantsId(Set<UserProject> participants){
        if(participants == null) return List.of();
        List<Long> participantsId = new ArrayList<>();
        for(UserProject participant : participants) {
            participantsId.add(participant.getUser().getId());
        }
        return participantsId;
    }

    private int getTasksCount(Set<Task> tasks) {
        if(tasks == null) return 0;
        int count = 0;
        for(Task task : tasks) {
            if(!TaskStatus.DONE.equals(task.getStatus())) count++;
        }

        return count;
    }

    private int getUsersCount(Set<UserProject> userProjects) {
        if(userProjects == null) return 0;
        return userProjects.size();
    }
}

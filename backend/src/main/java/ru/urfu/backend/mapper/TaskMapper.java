package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.project.ProjectParticipantDto;
import ru.urfu.backend.dto.project.ProjectTaskDto;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class TaskMapper {

    public ProjectTaskDto mapToProjectTaskDto(Task task){
        return new ProjectTaskDto(
                task.getId(),
                task.getProject().getId(),
                task.getTitle(),
                task.getDescription(),
                task.getRequirements(),
                task.getEvaluationCriteria(),
                task.getStatus(),
                task.getDeadline().toString(),
                task.getReviewType(),
                mapToProjectParticipantDtoList(task.getUsers())
        );
    }

    public List<ProjectParticipantDto> mapToProjectParticipantDtoList(Set<UserTask> userTasks){
        List<ProjectParticipantDto> projectParticipantDtos = new ArrayList<>();
        for(UserTask userTask : userTasks){
            projectParticipantDtos.add(mapToProjectParticipantDto(userTask));
        }
        return projectParticipantDtos;
    }

    public ProjectParticipantDto mapToProjectParticipantDto(UserTask userTask){
        return new ProjectParticipantDto(
                userTask.getUser().getId(),
                userTask.getUser().getLogin(),
                userTask.getUser().getEmail(),
                userTask.getUser().getFullName(),
                userTask.getUser().getAvatarFileTitle(),
                ProjectMemberRole.OWNER //FIXME: Убрать заглушку
        );
    }
}

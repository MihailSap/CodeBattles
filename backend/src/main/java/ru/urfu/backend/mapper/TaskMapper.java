package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.project.ProjectParticipantDto;
import ru.urfu.backend.dto.project.ProjectTaskDto;
import ru.urfu.backend.dto.tasks.TaskDetailsResponse;
import ru.urfu.backend.dto.tasks.TaskDoneResponse;
import ru.urfu.backend.dto.tasks.TaskListItemResponse;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.UserTaskType;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class TaskMapper {

    public TaskListItemResponse mapToTaskListItemResponse(Task task) {
        Set<UserTask> users = task.getUsers();
        Set<UserTask> aggignees = new HashSet<>();
        Set<UserTask> reviewers = new HashSet<>();
        for (UserTask userTask : users) {
            if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                reviewers.add(userTask);
            } else if(UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())){
                aggignees.add(userTask);
            }
        }
        return new TaskListItemResponse(
                task.getId(),
                task.getProject() == null ? null : task.getProject().getId(),
                task.getTitle(),
                task.getStatus(),
                task.getDeadline() == null ? "" : task.getDeadline().toString(),
                task.getReviewType(),
                mapToProjectParticipantDtoList(aggignees),
                mapToProjectParticipantDtoList(reviewers),
                0, //TODO: Реализовать корректное заполнение
                false, //TODO: Реализовать корректное заполнение
                task.getCreatedAt() == null ? "" : task.getCreatedAt().toString(),
                task.getUpdatedAt() == null ? "" : task.getUpdatedAt().toString()
        );
    }

    public TaskDetailsResponse mapToTaskDetailsResponse(Task task) {
        Set<UserTask> userTasks = task.getUsers();
        List<Long> assigneeIds = new ArrayList<>();
        List<Long> reviewersIds = new ArrayList<>();
        for (UserTask userTask : userTasks) {
            if(UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())){
                assigneeIds.add(userTask.getUser().getId());
            }else if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                reviewersIds.add(userTask.getUser().getId());
            }
        }

        Project project = task.getProject();

        return new TaskDetailsResponse(
                task.getId(),
                project.getId(),
                project.getOrganization() == null ? null : project.getOrganization().getId(),
                task.getSolution() == null ? null : task.getSolution().getId(),
                project.getTitle(),
                project.getIsPrivate(),
                project.getAiReviewEnabled(),
                task.getTitle(),
                task.getDescription(),
                task.getRequirements(),
                task.getEvaluationCriteria(),
                task.getStatus(),
                task.getDeadline() == null ? "" : task.getDeadline().toString(),
                task.getReviewType(),
                assigneeIds,
                reviewersIds,
                List.of(), //TODO: Уточнить, что нужно передавать
                List.of(), //TODO: Уточнить, что нужно передавать
                null, //TODO: Уточнить, как заполнять PermissionsResponse
                task.getCreatedAt() == null ? "" : task.getCreatedAt().toString(),
                task.getUpdatedAt() == null ? "" : task.getUpdatedAt().toString()
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

    public TaskDoneResponse mapToTaskDoneResponse(Task task, List<Long> reviewIds){
        return new TaskDoneResponse(
                task.getId(),
                task.getStatus(),
                reviewIds,
                ReviewStatus.COMPLETED,
                task.getCompletedAt().toString()
        );
    }
}

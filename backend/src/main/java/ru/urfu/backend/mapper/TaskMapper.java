package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.tasks.TaskResponse;
import ru.urfu.backend.model.Task;

import java.util.ArrayList;
import java.util.List;

@Component
public class TaskMapper {

    public TaskResponse mapToTaskResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getProject().getId(),
                task.getTitle(),
                task.getDescription(),
                task.getRequirements(),
                task.getEvaluationCriteria(),
                task.getStatus(),
                task.getDeadline().toString(),
                task.getReviewType()
        );
    }

    public List<TaskResponse> mapToTaskResponseList(List<Task> tasks) {
        List<TaskResponse> taskResponses = new ArrayList<>();
        for (Task task : tasks) {
            taskResponses.add(mapToTaskResponse(task));
        }
        return taskResponses;
    }
}

package ru.urfu.backend.service;

import ru.urfu.backend.dto.dashboard.DashboardTaskFilterStatus;
import ru.urfu.backend.dto.tasks.CreateTaskRequest;
import ru.urfu.backend.dto.tasks.UpdateTaskSettingsRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;

import java.util.List;

public interface TaskService {

    List<Task> getDashboardTasks(User user, Long projectId, DashboardTaskFilterStatus status);

    Task getById(Long id);

    Task create(CreateTaskRequest request, Project project) throws UserNotFoundException;

    Task update(Task task, UpdateTaskSettingsRequest request) throws UserNotFoundException;

    Task updateStatusInReview(Task task);

    Task updateStatusRework(Task task);

    Task updateStatusDone(Task task);

    void delete(Task task);

    boolean isUserAssigneeInTask(User user, Task task);

    boolean isUserReviewerInTask(User user, Task task);
}

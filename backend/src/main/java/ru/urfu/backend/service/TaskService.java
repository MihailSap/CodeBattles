package ru.urfu.backend.service;

import ru.urfu.backend.dto.tasks.CreateTaskRequestDto;
import ru.urfu.backend.dto.tasks.UpdateTaskSettingsRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;

import java.util.List;

public interface TaskService {

    Task getById(Long id);

    Task create(CreateTaskRequestDto request, Project project) throws UserNotFoundException;

    Task update(Task task, UpdateTaskSettingsRequest request) throws UserNotFoundException;

    void delete(Long id);

    boolean isUserAssigneeInTask(User user, Task task);

    boolean isUserReviewerInTask(User user, Task task);
}

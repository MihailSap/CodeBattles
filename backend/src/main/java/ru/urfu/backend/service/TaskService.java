package ru.urfu.backend.service;

import ru.urfu.backend.dto.tasks.TaskCreateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;

public interface TaskService {

    Task getById(Long id);

    Task create(TaskCreateRequest request, Project project) throws UserNotFoundException;

    void delete(Long id);
}

package ru.urfu.backend.service;

import ru.urfu.backend.dto.tasks.TaskCreateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;

import java.util.List;

public interface TaskService {

    Task getById(Long id);

    Task getByTitle(String title);

    List<Task> getByProject(Project project);

    Task create(TaskCreateRequest request, Project project) throws UserNotFoundException;

    void delete(Long id);
}

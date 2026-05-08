package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.tasks.TaskCreateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.repository.TaskRepository;
import ru.urfu.backend.repository.UserTaskRepository;
import ru.urfu.backend.service.TaskService;
import ru.urfu.backend.service.UserService;

@Service
public class TaskServiceImpl implements TaskService {

    private final UserTaskRepository userTaskRepository;
    private final TaskRepository taskRepository;
    private final UserService userService;

    @Autowired
    public TaskServiceImpl(
            UserTaskRepository userTaskRepository,
            TaskRepository taskRepository,
            UserService userService
    ) {
        this.userTaskRepository = userTaskRepository;
        this.taskRepository = taskRepository;
        this.userService = userService;
    }
    @Transactional(readOnly = true)

    @Override
    public Task getById(Long id){
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    @Transactional
    @Override
    public Task create(TaskCreateRequest request, Project project) throws UserNotFoundException {
        Task task = new Task();
        task.setTitle(request.name());
        task.setDescription(request.description());
        task.setRequirements(request.requirements());
        task.setEvaluationCriteria(request.evaluationCriteria());
        task.setReviewType(request.reviewType());
        task.setProject(project);

        for(Long assigneeId : request.assigneeIds()){
            User user = userService.getById(assigneeId);
            UserTask userTask = new UserTask();
            userTask.setUser(user);
            userTask.setTask(task);
            userTaskRepository.save(userTask);
        }

        return taskRepository.save(task);
    }

    @Transactional
    @Override
    public void delete(Long id){
        Task task = getById(id);
        taskRepository.delete(task);
    }
}

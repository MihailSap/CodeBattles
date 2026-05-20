package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.tasks.CreateTaskRequest;
import ru.urfu.backend.dto.tasks.UpdateTaskSettingsRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.model.enums.UserTaskType;
import ru.urfu.backend.repository.TaskRepository;
import ru.urfu.backend.repository.UserTaskRepository;
import ru.urfu.backend.service.TaskService;
import ru.urfu.backend.service.UserService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
                .orElseThrow(() -> new RuntimeException("Задача с id=%s не найдена".formatted(id)));
    }

    @Transactional
    @Override
    public Task create(CreateTaskRequest request, Project project) throws UserNotFoundException {
        Task task = new Task();
        task.setTitle(request.name());
        task.setDeadline(LocalDateTime.parse(request.deadline()));
        task.setDescription(request.description());
        task.setRequirements(request.requirements());
        task.setEvaluationCriteria(request.evaluationCriteria());
        task.setReviewType(request.reviewType());
        task.setProject(project);
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);

        addUsersToTask(task, request.assigneeIds(), UserTaskType.ASSIGNEE);
        addUsersToTask(task, request.reviewerIds(), UserTaskType.REVIEWER);

        return taskRepository.save(task);
    }

    @Transactional
    @Override
    public Task update(Task task, UpdateTaskSettingsRequest request) throws UserNotFoundException {
        String name = request.name();
        if(name != null && !name.isEmpty()){
            task.setTitle(name);
        }

        String description = request.description();
        if(description != null && !description.isEmpty()){
            task.setDescription(description);
        }

        String requirements = request.requirements();
        if(requirements != null && !requirements.isEmpty()){
            task.setRequirements(requirements);
        }

        String evaluationCriteria = request.evaluationCriteria();
        if(evaluationCriteria != null && !evaluationCriteria.isEmpty()){
            task.setEvaluationCriteria(evaluationCriteria);
        }

        String deadline = request.deadline();
        if(deadline != null && !deadline.isEmpty()){
            task.setDeadline(LocalDateTime.parse(deadline));
        }

        ReviewType reviewType = request.reviewType();
        if(reviewType != null){
            task.setReviewType(reviewType);
        }

        task.setUpdatedAt(LocalDateTime.now());

        List<Long> assigneeIds = request.assigneeIds();
        if(assigneeIds != null && !assigneeIds.isEmpty()){
            userTaskRepository.deleteByTaskAndUserTaskType(task, UserTaskType.ASSIGNEE);
            task.getUsers().removeIf(ut -> ut.getUserTaskType() == UserTaskType.ASSIGNEE);
            addUsersToTask(task, request.assigneeIds(), UserTaskType.ASSIGNEE);
        }
        List<Long> reviewerIds = request.reviewerIds();
        if(reviewerIds != null && !reviewerIds.isEmpty()){
            userTaskRepository.deleteByTaskAndUserTaskType(task, UserTaskType.REVIEWER);
            task.getUsers().removeIf(ut -> ut.getUserTaskType() == UserTaskType.REVIEWER);
            addUsersToTask(task, request.reviewerIds(), UserTaskType.REVIEWER);
        }
        return taskRepository.save(task);
    }

    @Transactional
    @Override
    public void delete(Long id){
        Task task = getById(id);
        taskRepository.delete(task);
    }

    @Transactional
    @Override
    public void delete(Task task){
        taskRepository.delete(task);
    }

    @Transactional
    public void addUsersToTask(Task task, List<Long> userIds, UserTaskType userTaskType)
            throws UserNotFoundException {
        for(Long assigneeId : userIds){
            User user = userService.getById(assigneeId);
            UserTask userTask = new UserTask();
            userTask.setUser(user);
            userTask.setTask(task);
            userTask.setUserTaskType(userTaskType);
            userTaskRepository.save(userTask);
            task.getUsers().add(userTask);
        }
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isUserReviewerInTask(User user, Task task){
        Optional<UserTask> userTask = userTaskRepository.findByUserAndTask(user, task);
        return userTask.isPresent() && UserTaskType.REVIEWER.equals(userTask.get().getUserTaskType());
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isUserAssigneeInTask(User user, Task task){
        Optional<UserTask> userTask = userTaskRepository.findByUserAndTask(user, task);
        return userTask.isPresent() && UserTaskType.ASSIGNEE.equals(userTask.get().getUserTaskType());
    }

    @Transactional
    @Override
    public Task updateStatusInReview(Task task){
        task.setUpdatedAt(LocalDateTime.now());
        task.setStatus(TaskStatus.IN_REVIEW);
        return taskRepository.save(task);
    }

    @Transactional
    @Override
    public Task complete(Task task){
        LocalDateTime now = LocalDateTime.now();
        task.setStatus(TaskStatus.DONE);
        task.setUpdatedAt(now);
        task.setCompletedAt(now);
        return taskRepository.save(task);
    }
}

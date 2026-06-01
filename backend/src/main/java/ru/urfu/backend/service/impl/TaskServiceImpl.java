package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.dashboard.DashboardTaskFilterStatus;
import ru.urfu.backend.dto.tasks.CreateTaskRequest;
import ru.urfu.backend.dto.tasks.UpdateTaskSettingsRequest;
import ru.urfu.backend.exception.customEx.NotEnoughReviewersException;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.ReviewVerdictType;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.model.enums.UserTaskType;
import ru.urfu.backend.repository.TaskRepository;
import ru.urfu.backend.repository.UserTaskRepository;
import ru.urfu.backend.service.NotificationService;
import ru.urfu.backend.service.TaskService;
import ru.urfu.backend.service.UserService;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TaskServiceImpl implements TaskService {

    private final UserTaskRepository userTaskRepository;
    private final TaskRepository taskRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Autowired
    public TaskServiceImpl(
            UserTaskRepository userTaskRepository,
            TaskRepository taskRepository,
            UserService userService,
            NotificationService notificationService
    ) {
        this.userTaskRepository = userTaskRepository;
        this.taskRepository = taskRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @Transactional
    @Override
    public List<Task> getDashboardTasks(
            User user, Long projectId, DashboardTaskFilterStatus status) {
        List<UserTask> userTasks = userTaskRepository
                .findAllByUserAndUserTaskType(user, UserTaskType.ASSIGNEE);
        LocalDateTime now = LocalDateTime.now();
        return userTasks.stream()
                .map(UserTask::getTask)
                .map(this::resolveReviewOutcome)
                .filter(task -> !TaskStatus.DONE.equals(task.getStatus()))
                .filter(task -> projectId == null || task.getProject().getId().equals(projectId))
                .filter(task -> {
                    if(status == null || DashboardTaskFilterStatus.ALL.equals(status)){
                        return true;
                    }
                    LocalDateTime deadline = task.getDeadline();
                    boolean overdue = deadline != null && deadline.isBefore(now);
                    if(DashboardTaskFilterStatus.ACTIVE.equals(status)){
                        return !overdue;
                    }
                    if(DashboardTaskFilterStatus.OVERDUE.equals(status)){
                        return overdue;
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    LocalDateTime aDeadline = a.getDeadline();
                    LocalDateTime bDeadline = b.getDeadline();
                    if(aDeadline == null && bDeadline == null){
                        return 0;
                    }
                    if(aDeadline == null){
                        return 1;
                    }
                    if(bDeadline == null){
                        return -1;
                    }
                    return aDeadline.compareTo(bDeadline);
                })
                .toList();
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
        task.setAiReviewEnabledAtCreation(Boolean.TRUE.equals(project.getAiReviewEnabled()));
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);

        ReviewType reviewType = request.reviewType();
        addUsersToTask(task, request.assigneeIds(), UserTaskType.ASSIGNEE);
        if(ReviewType.MANUAL_ASSIGNEES.equals(reviewType)){
            List<Long> reviewerIds = request.reviewerIds();
            if(reviewerIds == null || reviewerIds.isEmpty()){
                throw new RuntimeException("При ReviewType.MANUAL_ASSIGNEES необходимо указывать id пользователей");
            }
            addUsersToTask(task, request.reviewerIds(), UserTaskType.REVIEWER);
        } else if(ReviewType.AUTO_PROJECT.equals(reviewType)){
            addReviewersToTaskByProject(task, request.assigneeIds(), project);
        } else if(ReviewType.AUTO_ORGANIZATION.equals(reviewType)){
            addReviewersToTaskByOrganization(task, request.assigneeIds(), project);
        }

        Task savedTask = taskRepository.save(task);
        notificationService.notifyTaskAssigned(savedTask);
        return savedTask;
    }

    @Transactional
    public void addUsersToTask(Task task, List<Long> userIds, UserTaskType userTaskType)
            throws UserNotFoundException {
        for(Long assigneeId : userIds){
            User user = userService.getById(assigneeId);
            if(!user.getEnabled()){
                throw new RuntimeException("Указанный пользователь не подтвержден");
            }
            UserTask userTask = new UserTask();
            userTask.setUser(user);
            userTask.setTask(task);
            userTask.setUserTaskType(userTaskType);
            userTaskRepository.save(userTask);
            task.getUsers().add(userTask);
        }
    }

    @Transactional
    public void addReviewersToTaskByProject(Task task, List<Long> assigneesIds, Project project) {
        List<User> potentialReviewers = getPotentialReviewers(assigneesIds, project);
        if (potentialReviewers.isEmpty()) {
            throw new NotEnoughReviewersException("INSUFFICIENT_AUTO_REVIEWERS");
        }

        List<User> reviewers = potentialReviewers.size() <= 3
                ? potentialReviewers
                : potentialReviewers.stream()
                .sorted(Comparator.comparingInt(user -> user.getReviews().size()))
                .limit(3)
                .toList();

        reviewers.forEach(user -> addReviewerToTask(task, user));
    }

    @Transactional
    public void addReviewersToTaskByOrganization(Task task, List<Long> assigneesIds, Project project) {
        Organization organization = project.getOrganization();
        if(organization == null){
            throw new RuntimeException("Невозможно сделать автораспределение: организация отсутствует");
        }
        List<User> potentialReviewers = getPotentialReviewers(assigneesIds, organization);
        if (potentialReviewers.isEmpty()) {
            throw new NotEnoughReviewersException("INSUFFICIENT_AUTO_REVIEWERS");
        }

        List<User> reviewers = potentialReviewers.size() <= 3
                ? potentialReviewers
                : potentialReviewers.stream()
                .sorted(Comparator.comparingInt(user -> user.getReviews().size()))
                .limit(3)
                .toList();

        reviewers.forEach(user -> addReviewerToTask(task, user));
    }

    @Transactional
    public void addReviewerToTask(Task task, User user) {
        UserTask userTask = new UserTask();
        userTask.setUser(user);
        userTask.setTask(task);
        userTask.setUserTaskType(UserTaskType.REVIEWER);
        userTaskRepository.save(userTask);
        task.getUsers().add(userTask);
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

        ReviewType currentReviewType = task.getReviewType();
        ReviewType newReviewType = request.reviewType();
        boolean reviewTypeChanged = newReviewType != null && !newReviewType.equals(currentReviewType);
        if(reviewTypeChanged){
            task.setReviewType(newReviewType);
        }
        task.setUpdatedAt(LocalDateTime.now());
        List<Long> assigneeIds = request.assigneeIds();
        boolean assigneesChanged = assigneeIds != null;
        if(assigneesChanged){
            userTaskRepository.deleteByTaskAndUserTaskType(task, UserTaskType.ASSIGNEE);
            task.getUsers().removeIf(
                    ut -> ut.getUserTaskType() == UserTaskType.ASSIGNEE
            );
            addUsersToTask(task, assigneeIds, UserTaskType.ASSIGNEE);
        }
        List<Long> reviewerIds = request.reviewerIds();

        boolean reviewersChanged = reviewTypeChanged || assigneesChanged || reviewerIds != null;
        if(reviewersChanged){
            ReviewType effectiveReviewType =
                    reviewTypeChanged ? newReviewType : currentReviewType;
            if(reviewerIds != null && !reviewerIds.isEmpty()
                    && !ReviewType.MANUAL_ASSIGNEES.equals(effectiveReviewType)) {
                throw new RuntimeException(
                        "reviewerIds поддерживается только для MANUAL_ASSIGNEES"
                );
            }

            List<Long> effectiveAssigneeIds;
            if(assigneeIds != null){
                effectiveAssigneeIds = assigneeIds;
            } else {
                effectiveAssigneeIds = task.getUsers().stream()
                        .filter(ut -> ut.getUserTaskType() == UserTaskType.ASSIGNEE)
                        .map(ut -> ut.getUser().getId())
                        .toList();
            }


            if(ReviewType.MANUAL_ASSIGNEES.equals(effectiveReviewType)){
                if(reviewerIds == null || reviewerIds.isEmpty()){
                    throw new RuntimeException(
                            "При ReviewType.MANUAL_ASSIGNEES необходимо указывать id пользователей"
                    );
                }
                userTaskRepository.deleteByTaskAndUserTaskType(task, UserTaskType.REVIEWER);
                task.getUsers().removeIf(
                        ut -> ut.getUserTaskType() == UserTaskType.REVIEWER
                );
                addUsersToTask(task, reviewerIds, UserTaskType.REVIEWER);
            } else if(ReviewType.AUTO_PROJECT.equals(effectiveReviewType)){
                userTaskRepository.deleteByTaskAndUserTaskType(task, UserTaskType.REVIEWER);
                task.getUsers().removeIf(
                        ut -> ut.getUserTaskType() == UserTaskType.REVIEWER
                );
                Project project = task.getProject();
                addReviewersToTaskByProject(task, effectiveAssigneeIds, project);
            } else if(ReviewType.AUTO_ORGANIZATION.equals(effectiveReviewType)){
                userTaskRepository.deleteByTaskAndUserTaskType(task, UserTaskType.REVIEWER);
                task.getUsers().removeIf(
                        ut -> ut.getUserTaskType() == UserTaskType.REVIEWER
                );
                Project project = task.getProject();
                addReviewersToTaskByOrganization(task, effectiveAssigneeIds, project);
            }
        }
        return taskRepository.save(task);
    }

    @Transactional
    @Override
    public void delete(Task task){
        taskRepository.delete(task);
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

    @Transactional(readOnly = true)
    @Override
    public boolean canFinishReview(Task task) {
        if (!TaskStatus.IN_REVIEW.equals(task.getStatus()) || task.getReviews().isEmpty()) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        boolean hasApproval = false;
        for (Review review : task.getReviews()) {
            ReviewIteration reviewIteration = review.getLastIteration();
            if (reviewIteration == null) {
                return false;
            }
            ReviewVerdict reviewVerdict = reviewIteration.getReviewVerdict();
            boolean expiredVerdict = reviewVerdict != null
                    && reviewIteration.getCompletedAt() != null
                    && reviewIteration.getCompletedAt().isAfter(reviewIteration.getDeadline());
            if (reviewVerdict == null || expiredVerdict) {
                if (reviewVerdict == null && reviewIteration.getDeadline().isAfter(now)) {
                    return false;
                }
                continue;
            }
            if (!ReviewVerdictType.APPROVED.equals(reviewVerdict.getVerdict())) {
                return false;
            }
            hasApproval = true;
        }
        return hasApproval;
    }

    @Transactional
    @Override
    public Task resolveReviewOutcome(Task task) {
        if (!TaskStatus.IN_REVIEW.equals(task.getStatus()) || task.getReviews().isEmpty()) {
            return task;
        }
        LocalDateTime now = LocalDateTime.now();
        boolean hasCountedRework = false;
        boolean hasCountedVerdict = false;
        for (Review review : task.getReviews()) {
            ReviewIteration reviewIteration = review.getLastIteration();
            if (reviewIteration == null) {
                return task;
            }
            ReviewVerdict reviewVerdict = reviewIteration.getReviewVerdict();
            if (reviewVerdict == null) {
                if (reviewIteration.getDeadline().isAfter(now)) {
                    return task;
                }
                continue;
            }
            boolean expiredVerdict = reviewIteration.getCompletedAt() != null
                    && reviewIteration.getCompletedAt().isAfter(reviewIteration.getDeadline());
            if (reviewVerdict != null && !expiredVerdict) {
                hasCountedVerdict = true;
            }
            if (!expiredVerdict && ReviewVerdictType.REWORK.equals(reviewVerdict.getVerdict())) {
                hasCountedRework = true;
            }
        }
        if (hasCountedRework) {
            return updateStatusRework(task);
        }
        if (!hasCountedVerdict && ReviewType.MANUAL_ASSIGNEES.equals(task.getReviewType())) {
            notificationService.notifyReviewExpiredWithoutDecision(task);
        }
        return task;
    }

    @Transactional
    @Override
    public Task updateStatusInReview(Task task){
        task.setUpdatedAt(LocalDateTime.now());
        task.setStatus(TaskStatus.IN_REVIEW);
        return taskRepository.save(task);
    }

    @Override
    public Task updateStatusRework(Task task) {
        boolean statusChanged = !TaskStatus.REWORK.equals(task.getStatus());
        task.setUpdatedAt(LocalDateTime.now());
        task.setStatus(TaskStatus.REWORK);
        Task savedTask = taskRepository.save(task);
        if (statusChanged) {
            notificationService.notifyReviewReworkRequired(savedTask);
        }
        return savedTask;
    }

    @Transactional
    @Override
    public Task updateStatusDone(Task task){
        LocalDateTime now = LocalDateTime.now();
        task.setUpdatedAt(now);
        task.setCompletedAt(now);
        task.setStatus(TaskStatus.DONE);
        return taskRepository.save(task);
    }

    private List<User> getPotentialReviewers(List<Long> assigneesIds, Project project){
        List<Long> safeAssigneeIds =
                assigneesIds == null ? Collections.emptyList() : assigneesIds;
        List<User> potentialReviewers = new ArrayList<>();
        for(UserProject userProject : project.getUsers()){
            User user = userProject.getUser();
            if(!safeAssigneeIds.contains(user.getId())){
                potentialReviewers.add(user);
            }
        }
        return potentialReviewers;
    }

    private List<User> getPotentialReviewers(List<Long> assigneesIds, Organization organization){
        List<Long> safeAssigneeIds =
                assigneesIds == null ? Collections.emptyList() : assigneesIds;
        List<User> potentialReviewers = new ArrayList<>();
        for(UserOrganization userOrganization : organization.getMembers()){
            User user = userOrganization.getUser();
            if(!safeAssigneeIds.contains(user.getId()) && userOrganization.getEnabled()){
                potentialReviewers.add(user);
            }
        }
        return potentialReviewers;
    }
}

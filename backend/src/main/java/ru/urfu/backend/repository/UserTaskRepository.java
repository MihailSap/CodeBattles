package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserTask;
import ru.urfu.backend.model.enums.UserTaskType;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTaskRepository extends JpaRepository<UserTask, Long> {

    Optional<UserTask> findByUserAndTask(User user, Task task);

    List<UserTask> findAllByUserAndUserTaskType(User user, UserTaskType userTaskType);

    void deleteByTaskAndUserTaskType(Task task, UserTaskType userTaskType);
}

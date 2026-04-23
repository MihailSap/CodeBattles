package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.UserTask;

@Repository
public interface UserTaskRepository extends JpaRepository<UserTask, Long> {
}

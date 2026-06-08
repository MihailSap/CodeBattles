package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Modifying
    @Query(value = "UPDATE review SET solution_id = NULL WHERE task_id = :taskId", nativeQuery = true)
    void detachReviewsFromSolution(@Param("taskId") Long taskId);

    @Modifying
    @Query(value = """
            DELETE FROM solution_manual_text
            WHERE solution_id IN (
                SELECT id FROM solution WHERE task_id = :taskId
            )
            """, nativeQuery = true)
    void deleteSolutionManualTextByTaskId(@Param("taskId") Long taskId);

    @Modifying
    @Query(value = "DELETE FROM solution WHERE task_id = :taskId", nativeQuery = true)
    void deleteSolutionByTaskId(@Param("taskId") Long taskId);

    @Modifying
    @Query(value = "DELETE FROM user_task WHERE task_id = :taskId", nativeQuery = true)
    void deleteUserTasksByTaskId(@Param("taskId") Long taskId);

    @Modifying
    @Query(value = "DELETE FROM task WHERE id = :taskId", nativeQuery = true)
    void deleteTaskByIdDirectly(@Param("taskId") Long taskId);
}

package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.AdminEvent;
import ru.urfu.backend.model.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdminEventRepository extends JpaRepository<AdminEvent, Long>, JpaSpecificationExecutor<AdminEvent> {
    long countByTypeAndTargetUser(String type, User targetUser);

    long countByTypeAndTargetUserAndCreatedAtAfter(String type, User targetUser, LocalDateTime createdAt);

    Optional<AdminEvent> findFirstByTypeAndTargetUserOrderByCreatedAtDesc(String type, User targetUser);

    List<AdminEvent> findByTypeAndTargetUserAndCreatedAtAfter(String type, User targetUser, LocalDateTime createdAt);

    @Modifying
    @Query("UPDATE AdminEvent event SET event.actor = null WHERE event.actor = :user")
    void detachActor(@Param("user") User user);

    @Modifying
    @Query("UPDATE AdminEvent event SET event.targetUser = null WHERE event.targetUser = :user")
    void detachTargetUser(@Param("user") User user);
}

package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.urfu.backend.model.Notification;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.enums.NotificationCompletionAction;
import ru.urfu.backend.model.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserAndExpiresAtAfterOrderByCreatedAtDesc(User user, LocalDateTime now);

    List<Notification> findByUserAndExpiresAtAfter(User user, LocalDateTime now);

    List<Notification> findByUserAndCompletionActionAndExpiresAtAfter(
            User user,
            NotificationCompletionAction completionAction,
            LocalDateTime now
    );

    Optional<Notification> findByIdAndUserAndExpiresAtAfter(Long id, User user, LocalDateTime now);

    Optional<Notification> findFirstByUserAndTypeAndTaskIdAndReviewIdAndExpiresAtAfter(
            User user,
            NotificationType type,
            Long taskId,
            Long reviewId,
            LocalDateTime now
    );

    Optional<Notification> findFirstByUserAndTypeAndTaskIdAndExpiresAtAfter(
            User user,
            NotificationType type,
            Long taskId,
            LocalDateTime now
    );

    int deleteByExpiresAtLessThanEqual(LocalDateTime now);
}

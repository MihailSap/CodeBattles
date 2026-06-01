package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.notification.CompleteNotificationResponse;
import ru.urfu.backend.dto.notification.DeleteNotificationResponse;
import ru.urfu.backend.dto.notification.MarkAllNotificationsReadResponse;
import ru.urfu.backend.dto.notification.NotificationCompletionDto;
import ru.urfu.backend.dto.notification.NotificationDto;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.NotificationService;

import java.util.List;

@Tag(name = "Уведомления")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.NOTIFICATIONS)
public class NotificationController {

    private final AuthService authService;
    private final NotificationService notificationService;

    public NotificationController(AuthService authService, NotificationService notificationService) {
        this.authService = authService;
        this.notificationService = notificationService;
    }

    @Operation(description = "Активные уведомления текущего пользователя")
    @GetMapping
    public List<NotificationDto> getNotifications() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return notificationService.getActive(user);
    }

    @Operation(description = "Пометить активные уведомления прочитанными")
    @PatchMapping("/read-all")
    public MarkAllNotificationsReadResponse markAllRead() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return notificationService.markAllRead(user);
    }

    @Operation(description = "Удалить уведомление")
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<DeleteNotificationResponse> delete(
            @PathVariable("notificationId") Long notificationId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return ResponseEntity.ok(notificationService.delete(user, notificationId));
    }

    @Operation(description = "Закрыть уведомления по выполненному действию")
    @PostMapping("/complete")
    public CompleteNotificationResponse complete(
            @RequestBody NotificationCompletionDto completion
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        return notificationService.complete(user, completion);
    }
}

package ru.urfu.backend.websocket;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.JwtAuthentication;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.UserService;
import ru.urfu.backend.service.impl.NotificationRealtimeServiceImpl;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final UserService userService;
    private final NotificationRealtimeServiceImpl notificationRealtimeService;
    private final Map<String, Long> userIdsBySessionId = new ConcurrentHashMap<>();

    public NotificationWebSocketHandler(
            UserService userService,
            NotificationRealtimeServiceImpl notificationRealtimeService
    ) {
        this.userService = userService;
        this.notificationRealtimeService = notificationRealtimeService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = resolveUserId(session.getPrincipal());
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Unauthorized"));
            return;
        }

        userIdsBySessionId.put(session.getId(), userId);
        notificationRealtimeService.register(userId, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = userIdsBySessionId.remove(session.getId());
        if (userId != null) {
            notificationRealtimeService.unregister(userId, session);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        Long userId = userIdsBySessionId.remove(session.getId());
        if (userId != null) {
            notificationRealtimeService.unregister(userId, session);
        }
        session.close(CloseStatus.SERVER_ERROR);
    }

    private Long resolveUserId(Principal principal) throws UserNotFoundException {
        if (principal instanceof JwtAuthentication jwtAuthentication) {
            User user = userService.getByEmail(jwtAuthentication.getEmail());
            return user.getId();
        }

        if (principal instanceof Authentication authentication && authentication.getPrincipal() instanceof String email) {
            User user = userService.getByEmail(email);
            return user.getId();
        }

        return null;
    }
}

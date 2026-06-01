package ru.urfu.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import ru.urfu.backend.dto.notification.NotificationDto;
import ru.urfu.backend.dto.notification.NotificationRealtimeEvent;
import ru.urfu.backend.service.NotificationRealtimeService;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationRealtimeServiceImpl implements NotificationRealtimeService {

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<Long, Set<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();

    public NotificationRealtimeServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(Long userId, WebSocketSession session) {
        sessionsByUserId.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    public void unregister(Long userId, WebSocketSession session) {
        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUserId.remove(userId);
        }
    }

    @Override
    public void sendUpsert(Long userId, NotificationDto notification) {
        send(userId, NotificationRealtimeEvent.upserted(notification));
    }

    @Override
    public void sendDeleted(Long userId, String notificationId) {
        send(userId, NotificationRealtimeEvent.deleted(notificationId));
    }

    private void send(Long userId, NotificationRealtimeEvent event) {
        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException exception) {
            return;
        }

        sessions.removeIf(session -> !session.isOpen());
        sessions.forEach(session -> send(session, payload));
    }

    private void send(WebSocketSession session, String payload) {
        try {
            session.sendMessage(new TextMessage(payload));
        } catch (IOException exception) {
            try {
                session.close();
            } catch (IOException ignored) {
            }
        }
    }
}

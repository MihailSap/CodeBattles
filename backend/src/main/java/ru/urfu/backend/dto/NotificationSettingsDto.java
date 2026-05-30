package ru.urfu.backend.dto;

public record NotificationSettingsDto(
        Boolean reviewAssignments,
        Boolean newComments,
        Boolean achievements
) {
}

package ru.urfu.backend.dto.review;

public record ReviewProjectResponse(
        Long id,
        String name,
        Boolean isPrivate,
        Boolean aiReviewEnabled
) {}


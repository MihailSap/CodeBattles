package ru.urfu.backend.dto.project;

//TODO: Добавить валидацию
public record ProjectCreateRequest(
        Long ownerId,
        String name,
        String description,
        String repositoryUrl,
        String stack, //FIXME: Должен быть в виде списка
        Boolean isPrivate,
        Boolean aiReviewEnabled
) {
}

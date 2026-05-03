package ru.urfu.backend.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProjectCreateRequest(
        Long organizationId,
        @NotBlank(message = "Название не должно быть пустым")
        @Size(min = 1, max = 100, message = "Название должно иметь длину от 1 до 100")
        String name,
        @Size(max = 3000, message = "Описание не должно быть длиннее 3000 символов")
        String description,
        @Pattern(
                regexp = "^(https?://).+$",
                message = "Ссылка на репозиторий должна быть валидной"
        )
        String repositoryUrl,
        List<String> stack,
        Boolean isPrivate,
        Boolean aiReviewEnabled
) {
}

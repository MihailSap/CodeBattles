package ru.urfu.backend.dto.user.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfilePassportUpdateRequest(
        @NotBlank(message = "Текущий пароль не должен быть пустым")
        String currentPassword,
        @NotBlank(message = "Новый пароль не должен быть пустым")
        @Size(min = 8, max = 50, message = "Длина пароля должна составлять от 8 до 50 символов")
        String newPassword
) {
}

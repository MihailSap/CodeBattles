package ru.urfu.backend.dto.user.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

public record ProfileUpdateRequest(
        @NotBlank(message = "Имя не должно быть пустым")
        @Size(min = 1, max = 255, message = "Имя должно содержать от 1 до 255 символов")
        String name,
        MultipartFile avatar
) {
}

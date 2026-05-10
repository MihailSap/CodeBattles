package ru.urfu.backend.dto.user;

import org.springframework.web.multipart.MultipartFile;

public record UpdateAvatarRequest(
        MultipartFile avatar
) {
}

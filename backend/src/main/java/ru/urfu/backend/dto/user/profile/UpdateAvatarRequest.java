package ru.urfu.backend.dto.user.profile;

import org.springframework.web.multipart.MultipartFile;

public record UpdateAvatarRequest(MultipartFile file) {
}

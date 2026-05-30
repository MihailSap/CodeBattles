package ru.urfu.backend.dto.organization;

import org.springframework.web.multipart.MultipartFile;

public record OrganizationUpdateRequest(
        String name,
        String description,
        String link,
        MultipartFile avatar
) {
}

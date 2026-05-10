package ru.urfu.backend.dto.organization;

import org.springframework.web.multipart.MultipartFile;

public record OrganizationCreateRequest(
        String name,
        String link,
        String description,
        MultipartFile logo
) {
}

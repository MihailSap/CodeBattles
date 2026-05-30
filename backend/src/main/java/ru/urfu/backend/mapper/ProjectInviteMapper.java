package ru.urfu.backend.mapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.invite.ProjectInviteResponse;
import ru.urfu.backend.model.ProjectInvite;

@Component
public class ProjectInviteMapper {

    @Value("${app.public-url}")
    private String publicUrl;

    public ProjectInviteResponse mapToProjectInviteResponse(ProjectInvite projectInvite) {
        String token = projectInvite.getToken();
        return new ProjectInviteResponse(
                token,
                "http://%s/projects/join/%s".formatted(publicUrl, token),
                projectInvite.getProject().getId(),
                projectInvite.getExpiresAt().toString(),
                projectInvite.getReusable(),
                projectInvite.getCreatedAt().toString()
        );
    }
}

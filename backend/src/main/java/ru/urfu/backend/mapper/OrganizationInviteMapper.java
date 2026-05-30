package ru.urfu.backend.mapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.invite.OrganizationInviteDto;
import ru.urfu.backend.dto.invite.OrganizationInviteShortResponse;
import ru.urfu.backend.model.OrganizationInvite;

@Component
public class OrganizationInviteMapper {

    @Value("${app.public-url}")
    private String publicUrl;

    public OrganizationInviteDto mapToOrganizationInviteDto(OrganizationInvite organizationInvite) {
        String token = organizationInvite.getToken();
        return new OrganizationInviteDto(
                token,
                organizationInvite.getOrganization().getId(),
                "http://%s/projects/join/%s".formatted(publicUrl, token),
                organizationInvite.getReusable(),
                organizationInvite.getExpiresAt().toString(),
                organizationInvite.getCreatedAt().toString()
        );
    }

    public OrganizationInviteShortResponse mapToOrganizationInviteShortResponse(OrganizationInvite organizationInvite){
        return new OrganizationInviteShortResponse(
                organizationInvite.getOrganization().getId(),
                organizationInvite.getOrganization().getTitle(),
                organizationInvite.getExpiresAt().toString(),
                organizationInvite.getReusable()
        );
    }
}

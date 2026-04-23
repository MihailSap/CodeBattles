package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.organization.OrganizationResponse;
import ru.urfu.backend.model.Organization;

import java.util.ArrayList;
import java.util.List;

@Component
public class OrganizationMapper {

    public List<OrganizationResponse> mapToOrganizationResponses(List<Organization> organizations) {
        List<OrganizationResponse> organizationResponses = new ArrayList<>();
        for (Organization organization : organizations) {
            organizationResponses.add(mapToOrganizationResponse(organization));
        }
        return organizationResponses;
    }

    public OrganizationResponse mapToOrganizationResponse(Organization organization) {
        return new OrganizationResponse(
                organization.getTitle(),
                organization.getDescription(),
                List.of(), //FIXME
                List.of() //FIXME
        );
    }
}

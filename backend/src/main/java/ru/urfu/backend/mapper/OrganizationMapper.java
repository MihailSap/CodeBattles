package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.organization.OrganizationDetailsDto;
import ru.urfu.backend.dto.organization.OrganizationListItemDto;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.enums.OrganizationRole;

import java.util.ArrayList;
import java.util.List;

@Component
public class OrganizationMapper {

    public OrganizationDetailsDto mapToOrganizationDetailsDto(Organization organization) {
        return new OrganizationDetailsDto(
                organization.getId(),
                organization.getTitle(),
                organization.getDescription(),
                organization.getLink(),
                organization.getLogo(),
                1L, //FIXME
                OrganizationRole.TEAM_LEAD, //FIXME
                List.of(), //FIXME
                List.of(), //FIXME
                List.of() //FIXME
        );
    }

    public List<OrganizationListItemDto> mapToOrganizationListDto(List<Organization> organizations) {
        List<OrganizationListItemDto> organizationListItemDtos = new ArrayList<>();
        for (Organization organization : organizations) {
            organizationListItemDtos.add(mapToOrganizationListItemDto(organization));
        }
        return organizationListItemDtos;
    }

    public OrganizationListItemDto mapToOrganizationListItemDto(Organization organization) {
        return new OrganizationListItemDto(
                organization.getId(),
                organization.getLogo(),
                organization.getTitle(),
                organization.getLink(),
                organization.getDescription(),
                getMembersCount(organization),
                getProjectsCount(organization),
                OrganizationRole.TEAM_LEAD, //FIXME,
                false //FIXME
        );
    }

    private int getMembersCount(Organization organization) {
        if(organization.getMembers() == null) return 0;
        return organization.getMembers().size();
    }

    private int getProjectsCount(Organization organization) {
        if(organization.getProjects() == null) return 0;
        return organization.getProjects().size();
    }
}

package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.leaderboard.LeaderboardEntityResponse;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.UserOrganization;

import java.util.ArrayList;
import java.util.List;

@Component
public class LeaderboardMapper {

    public List<Organization> extractOrganizations(List<UserOrganization> userOrganizations) {
        List<Organization> organizations = new ArrayList<>();
        for (UserOrganization userOrganization : userOrganizations) {
            organizations.add(userOrganization.getOrganization());
        }
        return organizations;
    }

    public List<LeaderboardEntityResponse> mapToLeaderboardEntityResponses(List<Organization> organizations) {
        List<LeaderboardEntityResponse> leaderboardEntityResponses = new ArrayList<>();
        for (Organization organization : organizations) {
            leaderboardEntityResponses.add(mapToLeaderboardEntityResponse(organization));
        }
        return leaderboardEntityResponses;
    }

    public LeaderboardEntityResponse mapToLeaderboardEntityResponse(Organization organization){
        return new LeaderboardEntityResponse(
                organization.getId(),
                organization.getTitle(),
                organization.getLastActivityAt() == null ? null : organization.getLastActivityAt().toString()
        );
    }
}

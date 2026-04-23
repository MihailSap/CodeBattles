package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.enums.OrganizationRole;
import ru.urfu.backend.model.enums.ProjectMemberRole;

@Entity
@Table(name = "user_organization")
public class UserOrganization extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Enumerated(EnumType.STRING)
    private OrganizationRole organizationRole;

    private Boolean isAdmin = false;

    private Boolean isEnabled = false;

    public UserOrganization() {}

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public OrganizationRole getOrganizationRole() {
        return organizationRole;
    }

    public void setOrganizationRole(OrganizationRole organizationRole) {
        this.organizationRole = organizationRole;
    }

    public Boolean getAdmin() {
        return isAdmin;
    }

    public void setAdmin(Boolean admin) {
        isAdmin = admin;
    }

    public Boolean getEnabled() {
        return isEnabled;
    }

    public void setEnabled(Boolean enabled) {
        isEnabled = enabled;
    }
}

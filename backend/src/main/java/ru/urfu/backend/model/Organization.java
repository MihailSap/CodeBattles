package ru.urfu.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import ru.urfu.backend.model.base.BaseEntity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "organization")
public class Organization extends BaseEntity {

    private String title;

    private String description;

    private String avatarFileTitle;

    private String link;

    private LocalDateTime lastActivityAt;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserOrganization> members = new HashSet<>();

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Project> projects = new HashSet<>();

    public Organization() {}

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<Project> getProjects() {
        return projects;
    }

    public void setProjects(Set<Project> projects) {
        this.projects = projects;
    }

    public Set<UserOrganization> getMembers() {
        return members;
    }

    public void setMembers(Set<UserOrganization> members) {
        this.members = members;
    }

    public String getAvatarFileTitle() {
        return avatarFileTitle;
    }

    public void setAvatarFileTitle(String logo) {
        this.avatarFileTitle = logo;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public LocalDateTime getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(LocalDateTime lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }
}

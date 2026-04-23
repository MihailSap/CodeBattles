package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "project")
public class Project extends BaseEntity {

    private String title;

    private String description;

    private String repositoryUrl;

    private String stack;

    private Boolean isPrivate;

    private Boolean aiReviewEnabled;

    @ManyToOne
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserProject> users = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Task> tasks = new HashSet<>();

    public Project() {}

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

    public String getStack() {
        return stack;
    }

    public void setStack(String stack) {
        this.stack = stack;
    }

    public Boolean getPrivate() {
        return isPrivate;
    }

    public void setPrivate(Boolean aPrivate) {
        isPrivate = aPrivate;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public String getRepositoryUrl() {
        return repositoryUrl;
    }

    public void setRepositoryUrl(String repositoryUrl) {
        this.repositoryUrl = repositoryUrl;
    }

    public Boolean getAiReviewEnabled() {
        return aiReviewEnabled;
    }

    public void setAiReviewEnabled(Boolean aiReviewEnabled) {
        this.aiReviewEnabled = aiReviewEnabled;
    }

    public Set<UserProject> getUsers() {
        return users;
    }

    public void setUsers(Set<UserProject> users) {
        this.users = users;
    }

    public void addUser(User user, ProjectMemberRole role) {
        UserProject userProject = new UserProject();
        userProject.setUser(user);
        userProject.setProject(this);
        userProject.setProjectMemberRole(role);

        users.add(userProject);
        user.getProjects().add(userProject);
    }
}

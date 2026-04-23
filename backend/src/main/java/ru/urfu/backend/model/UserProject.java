package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.enums.ProjectMemberRole;

@Entity
@Table(name = "user_project")
public class UserProject extends BaseEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Enumerated(EnumType.STRING)
    private ProjectMemberRole projectMemberRole;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public ProjectMemberRole getProjectMemberRole() {
        return projectMemberRole;
    }

    public void setProjectMemberRole(ProjectMemberRole projectMemberRole) {
        this.projectMemberRole = projectMemberRole;
    }
}

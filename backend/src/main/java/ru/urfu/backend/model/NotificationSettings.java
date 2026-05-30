package ru.urfu.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import ru.urfu.backend.model.base.BaseEntity;

@Entity
@Table(name = "notification_settings")
public class NotificationSettings extends BaseEntity {

    private Boolean reviewAssignments;

    private Boolean newComments;

    private Boolean achievements;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    public Boolean getReviewAssignments() {
        return reviewAssignments;
    }

    public void setReviewAssignments(Boolean reviewAssignments) {
        this.reviewAssignments = reviewAssignments;
    }

    public Boolean getNewComments() {
        return newComments;
    }

    public void setNewComments(Boolean newComments) {
        this.newComments = newComments;
    }

    public Boolean getAchievements() {
        return achievements;
    }

    public void setAchievements(Boolean achievements) {
        this.achievements = achievements;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}

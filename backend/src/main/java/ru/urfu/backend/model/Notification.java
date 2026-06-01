package ru.urfu.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.NotificationCompletionAction;
import ru.urfu.backend.model.enums.NotificationTargetKind;
import ru.urfu.backend.model.enums.NotificationType;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "is_read")
    private Boolean read = false;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    private NotificationTargetKind targetKind;

    private Long organizationId;

    private Long projectId;

    private Long taskId;

    private Long reviewId;

    private Long targetUserId;

    @Column(name = "task_name")
    private String taskName;

    @Enumerated(EnumType.STRING)
    private NotificationCompletionAction completionAction;

    private Integer threadReplyCount;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public NotificationTargetKind getTargetKind() {
        return targetKind;
    }

    public void setTargetKind(NotificationTargetKind targetKind) {
        this.targetKind = targetKind;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public Long getReviewId() {
        return reviewId;
    }

    public void setReviewId(Long reviewId) {
        this.reviewId = reviewId;
    }

    public Long getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public NotificationCompletionAction getCompletionAction() {
        return completionAction;
    }

    public void setCompletionAction(NotificationCompletionAction completionAction) {
        this.completionAction = completionAction;
    }

    public Integer getThreadReplyCount() {
        return threadReplyCount;
    }

    public void setThreadReplyCount(Integer threadReplyCount) {
        this.threadReplyCount = threadReplyCount;
    }
}

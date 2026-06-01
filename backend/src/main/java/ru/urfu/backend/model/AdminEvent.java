package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_event")
public class AdminEvent extends BaseEntity {

    @Column(nullable = false)
    private String type;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    @Column(name = "comment_id")
    private Long commentId;

    @Column(name = "comment_text_preview")
    private String commentTextPreview;

    @Column(name = "removed_comment_id")
    private Long removedCommentId;

    private String reason;

    private String decision;

    private String consequence;

    @Column(name = "penalty_points")
    private Integer penaltyPoints;

    @Column(name = "target_title")
    private String targetTitle;

    @Column(name = "target_url")
    private String targetUrl;

    @Column(name = "target_project_id")
    private Long targetProjectId;

    @Column(name = "target_task_id")
    private Long targetTaskId;

    @Column(name = "target_review_id")
    private Long targetReviewId;

    @Column(name = "scope_type")
    private String scopeType;

    @Column(name = "scope_name")
    private String scopeName;

    @Column(name = "scope_url")
    private String scopeUrl;

    @Column(name = "scope_organization_id")
    private Long scopeOrganizationId;

    @Column(name = "scope_project_id")
    private Long scopeProjectId;

    @Column(name = "previous_value")
    private String previousValue;

    @Column(name = "new_value")
    private String newValue;

    private String details;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getActor() {
        return actor;
    }

    public void setActor(User actor) {
        this.actor = actor;
    }

    public User getTargetUser() {
        return targetUser;
    }

    public void setTargetUser(User targetUser) {
        this.targetUser = targetUser;
    }

    public Long getCommentId() {
        return commentId;
    }

    public void setCommentId(Long commentId) {
        this.commentId = commentId;
    }

    public String getCommentTextPreview() {
        return commentTextPreview;
    }

    public void setCommentTextPreview(String commentTextPreview) {
        this.commentTextPreview = commentTextPreview;
    }

    public Long getRemovedCommentId() {
        return removedCommentId;
    }

    public void setRemovedCommentId(Long removedCommentId) {
        this.removedCommentId = removedCommentId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getConsequence() {
        return consequence;
    }

    public void setConsequence(String consequence) {
        this.consequence = consequence;
    }

    public Integer getPenaltyPoints() {
        return penaltyPoints;
    }

    public void setPenaltyPoints(Integer penaltyPoints) {
        this.penaltyPoints = penaltyPoints;
    }

    public String getTargetTitle() {
        return targetTitle;
    }

    public void setTargetTitle(String targetTitle) {
        this.targetTitle = targetTitle;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }

    public Long getTargetProjectId() {
        return targetProjectId;
    }

    public void setTargetProjectId(Long targetProjectId) {
        this.targetProjectId = targetProjectId;
    }

    public Long getTargetTaskId() {
        return targetTaskId;
    }

    public void setTargetTaskId(Long targetTaskId) {
        this.targetTaskId = targetTaskId;
    }

    public Long getTargetReviewId() {
        return targetReviewId;
    }

    public void setTargetReviewId(Long targetReviewId) {
        this.targetReviewId = targetReviewId;
    }

    public String getScopeType() {
        return scopeType;
    }

    public void setScopeType(String scopeType) {
        this.scopeType = scopeType;
    }

    public String getScopeName() {
        return scopeName;
    }

    public void setScopeName(String scopeName) {
        this.scopeName = scopeName;
    }

    public String getScopeUrl() {
        return scopeUrl;
    }

    public void setScopeUrl(String scopeUrl) {
        this.scopeUrl = scopeUrl;
    }

    public Long getScopeOrganizationId() {
        return scopeOrganizationId;
    }

    public void setScopeOrganizationId(Long scopeOrganizationId) {
        this.scopeOrganizationId = scopeOrganizationId;
    }

    public Long getScopeProjectId() {
        return scopeProjectId;
    }

    public void setScopeProjectId(Long scopeProjectId) {
        this.scopeProjectId = scopeProjectId;
    }

    public String getPreviousValue() {
        return previousValue;
    }

    public void setPreviousValue(String previousValue) {
        this.previousValue = previousValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}

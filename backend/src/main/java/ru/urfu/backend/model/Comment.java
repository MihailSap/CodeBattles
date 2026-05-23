package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ReviewCommentCategory;
import ru.urfu.backend.model.enums.ReviewCommentSeverity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "comment")
public class Comment extends BaseEntity {

    private String file;

    private Integer startLine;

    private Integer endLine;

    private String text;

    private Boolean revealName;

    private LocalDateTime closedAt;

    private LocalDateTime updatedAt;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private CommentAuthorRole commentAuthorRole;

    @Enumerated(EnumType.STRING)
    private ReviewCommentCategory category;

    @Enumerated(EnumType.STRING)
    private ReviewCommentSeverity severity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_iteration_id")
    private ReviewIteration reviewIteration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CommentReaction> reactions = new HashSet<>();

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CommentReport> reports = new HashSet<>();

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Comment> replies = new HashSet<>();

    public ReviewIteration getReviewIteration() {
        return reviewIteration;
    }

    public void setReviewIteration(ReviewIteration review) {
        this.reviewIteration = review;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getFile() {
        return file;
    }

    public void setFile(String file) {
        this.file = file;
    }

    public Integer getStartLine() {
        return startLine;
    }

    public void setStartLine(Integer startLine) {
        this.startLine = startLine;
    }

    public Integer getEndLine() {
        return endLine;
    }

    public void setEndLine(Integer endLine) {
        this.endLine = endLine;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Boolean getRevealName() {
        return revealName;
    }

    public void setRevealName(Boolean revealName) {
        this.revealName = revealName;
    }

    public ReviewCommentCategory getCategory() {
        return category;
    }

    public void setCategory(ReviewCommentCategory category) {
        this.category = category;
    }

    public ReviewCommentSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(ReviewCommentSeverity severity) {
        this.severity = severity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<CommentReaction> getReactions() {
        return reactions;
    }

    public void setReactions(Set<CommentReaction> reactions) {
        this.reactions = reactions;
    }

    public Set<CommentReport> getReports() {
        return reports;
    }

    public void setReports(Set<CommentReport> reports) {
        this.reports = reports;
    }

    public Comment getParentComment() {
        return parentComment;
    }

    public void setParentComment(Comment parentComment) {
        this.parentComment = parentComment;
    }

    public Set<Comment> getReplies() {
        return replies;
    }

    public void setReplies(Set<Comment> replies) {
        this.replies = replies;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public CommentAuthorRole getCommentAuthorRole() {
        return commentAuthorRole;
    }

    public void setCommentAuthorRole(CommentAuthorRole commentAuthorRole) {
        this.commentAuthorRole = commentAuthorRole;
    }
}

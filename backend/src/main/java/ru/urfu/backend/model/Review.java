package ru.urfu.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.ReviewStatus;

import java.time.LocalDateTime;

@Entity(name = "review")
public class Review extends BaseEntity {

    private String body;

    private LocalDateTime uploadedAt;

    private LocalDateTime completedAt;

    private LocalDateTime deadline = LocalDateTime.now().plusDays(14);

    private Boolean revealAuthorAfterReview = false;

    private ReviewStatus status = ReviewStatus.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solution_id")
    private Solution solution;

    public Review(){}

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Task getTask() {
        return task;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Solution getSolution() {
        return solution;
    }

    public void setSolution(Solution solution) {
        this.solution = solution;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public ReviewStatus getStatus() {
        return status;
    }

    public void setStatus(ReviewStatus status) {
        this.status = status;
    }

    public Boolean getRevealAuthorAfterReview() {
        return revealAuthorAfterReview;
    }

    public void setRevealAuthorAfterReview(Boolean revealAuthorAfterReview) {
        this.revealAuthorAfterReview = revealAuthorAfterReview;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime completedAt) {
        this.uploadedAt = completedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}

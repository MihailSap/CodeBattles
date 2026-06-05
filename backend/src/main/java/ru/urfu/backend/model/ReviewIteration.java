package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.TaskStatus;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "review_iteration")
public class ReviewIteration extends BaseEntity {

    private LocalDateTime uploadedAt;

    private LocalDateTime completedAt;

    private LocalDateTime deadline;

    private Integer iterationNumber;

    @Enumerated(EnumType.STRING)
    private TaskStatus taskStatusAfterIteration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private Review review;

    @OneToOne(mappedBy = "reviewIteration", cascade = CascadeType.ALL, orphanRemoval = true)
    private ReviewVerdict reviewVerdict;

    @OneToOne(mappedBy = "reviewIteration", cascade = CascadeType.ALL, orphanRemoval = true)
    private AiSolutionEvaluation aiSolutionEvaluation;

    @OneToOne(mappedBy = "reviewIteration", cascade = CascadeType.ALL, orphanRemoval = true)
    private AiReviewEvaluation aiReviewEvaluation;

    @OneToMany(mappedBy = "reviewIteration", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Comment> comments = new HashSet<>();

    @OneToMany(mappedBy = "reviewIteration", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ReviewFileContent> reviewFileContents = new HashSet<>();

    public Integer getIterationNumber() {
        return iterationNumber;
    }

    public void setIterationNumber(Integer iterationNumber) {
        this.iterationNumber = iterationNumber;
    }

    public Set<Comment> getComments() {
        return comments;
    }

    public void setComments(Set<Comment> comments) {
        this.comments = comments;
    }

    public ReviewVerdict getReviewVerdict() {
        return reviewVerdict;
    }

    public void setReviewVerdict(ReviewVerdict reviewVerdict) {
        this.reviewVerdict = reviewVerdict;
    }

    public AiSolutionEvaluation getAiSolutionEvaluation() {
        return aiSolutionEvaluation;
    }

    public void setAiSolutionEvaluation(AiSolutionEvaluation aiSolutionEvaluation) {
        this.aiSolutionEvaluation = aiSolutionEvaluation;
    }

    public AiReviewEvaluation getAiReviewEvaluation() {
        return aiReviewEvaluation;
    }

    public void setAiReviewEvaluation(AiReviewEvaluation aiReviewEvaluation) {
        this.aiReviewEvaluation = aiReviewEvaluation;
    }

    public Review getReview() {
        return review;
    }

    public void setReview(Review review) {
        this.review = review;
    }

    public Set<ReviewFileContent> getReviewFileContents() {
        return reviewFileContents;
    }

    public void setReviewFileContents(Set<ReviewFileContent> reviewFileContents) {
        this.reviewFileContents = reviewFileContents;
    }

    public TaskStatus getTaskStatusAfterIteration() {
        return taskStatusAfterIteration;
    }

    public void setTaskStatusAfterIteration(TaskStatus taskStatusAfterIteration) {
        this.taskStatusAfterIteration = taskStatusAfterIteration;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }
}

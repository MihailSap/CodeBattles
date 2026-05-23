package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.ReviewStatus;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;

@Entity(name = "review")
public class Review extends BaseEntity {

    private Boolean revealAuthorAfterReview = false;

    private ReviewStatus status;

    private Integer reviewerIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solution_id")
    private Solution solution;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ReviewIteration> reviewIterations = new HashSet<>();

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

    public Integer getReviewerIndex() {
        return reviewerIndex;
    }

    public void setReviewerIndex(Integer reviewerIndex) {
        this.reviewerIndex = reviewerIndex;
    }

    public Set<ReviewIteration> getReviewIterations() {
        return reviewIterations;
    }

    public void setReviewIterations(Set<ReviewIteration> reviewIterations) {
        this.reviewIterations = reviewIterations;
    }

    public ReviewIteration getLastIteration() {
        return reviewIterations.stream()
                .max(Comparator.comparing(ReviewIteration::getIterationNumber))
                .orElse(null);
    }

}

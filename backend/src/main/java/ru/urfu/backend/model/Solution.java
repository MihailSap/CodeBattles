package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.SolutionUploadType;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "solution")
public class Solution extends BaseEntity {

    private Boolean revealAuthorAfterReview;

    @Enumerated(EnumType.STRING)
    private SolutionUploadType uploadType;

    private LocalDateTime uploadedAt;

    @OneToOne
    @JoinColumn(name = "task_id", nullable = false, unique = true)
    private Task task;

    @OneToOne(mappedBy = "solution", cascade = CascadeType.ALL, orphanRemoval = true)
    private SolutionManualText solutionManualText;

    @OneToOne(mappedBy = "solution", cascade = CascadeType.ALL, orphanRemoval = true)
    private SolutionGitPullRequest solutionGitPullRequest;

    @OneToMany(mappedBy = "solution", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SolutionFile> solutionFiles = new HashSet<>();

    @OneToMany(mappedBy = "solution", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Review> reviews = new HashSet<>();

    public Task getTask() {
        return task;
    }

    public void setTask(Task task) {
        this.task = task;
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

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public SolutionUploadType getUploadType() {
        return uploadType;
    }

    public void setUploadType(SolutionUploadType uploadType) {
        this.uploadType = uploadType;
    }

    public SolutionManualText getSolutionManualText() {
        return solutionManualText;
    }

    public void setSolutionManualText(SolutionManualText solutionManualText) {
        this.solutionManualText = solutionManualText;
    }

    public SolutionGitPullRequest getSolutionGitPullRequest() {
        return solutionGitPullRequest;
    }

    public void setSolutionGitPullRequest(SolutionGitPullRequest solutionGitPullRequest) {
        this.solutionGitPullRequest = solutionGitPullRequest;
    }

    public Set<SolutionFile> getSolutionFiles() {
        return solutionFiles;
    }

    public void setSolutionFiles(Set<SolutionFile> solutionFiles) {
        this.solutionFiles = solutionFiles;
    }

    public Set<Review> getReviews() {
        return reviews;
    }

    public void setReviews(Set<Review> reviews) {
        this.reviews = reviews;
    }
}

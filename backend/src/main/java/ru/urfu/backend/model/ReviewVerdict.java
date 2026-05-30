package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.ReviewVerdictType;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_verdict")
public class ReviewVerdict extends BaseEntity {

    private Integer architecture;

    private Integer readability;

    private Integer testability;

    private Integer scalability;

    private Integer overallScore;

    private String comment;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private ReviewVerdictType verdict;

    @OneToOne
    @JoinColumn(name = "review_iteration_id", nullable = false, unique = true)
    private ReviewIteration reviewIteration;

    public Integer getArchitecture() {
        return architecture;
    }

    public void setArchitecture(Integer architecture) {
        this.architecture = architecture;
    }

    public Integer getReadability() {
        return readability;
    }

    public void setReadability(Integer readability) {
        this.readability = readability;
    }

    public Integer getTestability() {
        return testability;
    }

    public void setTestability(Integer testability) {
        this.testability = testability;
    }

    public Integer getScalability() {
        return scalability;
    }

    public void setScalability(Integer scalability) {
        this.scalability = scalability;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public ReviewVerdictType getVerdict() {
        return verdict;
    }

    public void setVerdict(ReviewVerdictType verdict) {
        this.verdict = verdict;
    }

    public ReviewIteration getReviewIteration() {
        return reviewIteration;
    }

    public void setReviewIteration(ReviewIteration review) {
        this.reviewIteration = review;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

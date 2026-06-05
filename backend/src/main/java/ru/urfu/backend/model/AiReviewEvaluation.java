package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.AiEvaluationStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_review_evaluation")
public class AiReviewEvaluation extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "review_iteration_id", nullable = false, unique = true)
    private ReviewIteration reviewIteration;

    @Enumerated(EnumType.STRING)
    private AiEvaluationStatus status = AiEvaluationStatus.PENDING;

    private Integer qualityScore;

    private Integer specificity;

    private Integer techDepth;

    private Integer correctness;

    private Integer nonToxicity;

    private String summary;

    private String errorMessage;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public ReviewIteration getReviewIteration() {
        return reviewIteration;
    }

    public void setReviewIteration(ReviewIteration reviewIteration) {
        this.reviewIteration = reviewIteration;
    }

    public AiEvaluationStatus getStatus() {
        return status;
    }

    public void setStatus(AiEvaluationStatus status) {
        this.status = status;
    }

    public Integer getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(Integer qualityScore) {
        this.qualityScore = qualityScore;
    }

    public Integer getSpecificity() {
        return specificity;
    }

    public void setSpecificity(Integer specificity) {
        this.specificity = specificity;
    }

    public Integer getTechDepth() {
        return techDepth;
    }

    public void setTechDepth(Integer techDepth) {
        this.techDepth = techDepth;
    }

    public Integer getCorrectness() {
        return correctness;
    }

    public void setCorrectness(Integer correctness) {
        this.correctness = correctness;
    }

    public Integer getNonToxicity() {
        return nonToxicity;
    }

    public void setNonToxicity(Integer nonToxicity) {
        this.nonToxicity = nonToxicity;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
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
}

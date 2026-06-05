package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.AiEvaluationStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_solution_evaluation")
public class AiSolutionEvaluation extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "review_iteration_id", nullable = false, unique = true)
    private ReviewIteration reviewIteration;

    @Enumerated(EnumType.STRING)
    private AiEvaluationStatus status = AiEvaluationStatus.PENDING;

    private Integer qualityScore;

    private String cyclomaticComplexity;

    private Integer solidViolationsCount;

    private String solidViolationsSeverity;

    private String overallComment;

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

    public String getCyclomaticComplexity() {
        return cyclomaticComplexity;
    }

    public void setCyclomaticComplexity(String cyclomaticComplexity) {
        this.cyclomaticComplexity = cyclomaticComplexity;
    }

    public Integer getSolidViolationsCount() {
        return solidViolationsCount;
    }

    public void setSolidViolationsCount(Integer solidViolationsCount) {
        this.solidViolationsCount = solidViolationsCount;
    }

    public String getSolidViolationsSeverity() {
        return solidViolationsSeverity;
    }

    public void setSolidViolationsSeverity(String solidViolationsSeverity) {
        this.solidViolationsSeverity = solidViolationsSeverity;
    }

    public String getOverallComment() {
        return overallComment;
    }

    public void setOverallComment(String overallComment) {
        this.overallComment = overallComment;
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

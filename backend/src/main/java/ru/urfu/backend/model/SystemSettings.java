package ru.urfu.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import ru.urfu.backend.model.base.BaseEntity;

@Entity
@Table(name = "system_settings")
public class SystemSettings extends BaseEntity {

    private Integer reviewDeadlineDays;

    private String aiSystemPrompt;

    public Integer getReviewDeadlineDays() {
        return reviewDeadlineDays;
    }

    public void setReviewDeadlineDays(Integer reviewDeadlineDays) {
        this.reviewDeadlineDays = reviewDeadlineDays;
    }

    public String getAiSystemPrompt() {
        return aiSystemPrompt;
    }

    public void setAiSystemPrompt(String aiSystemPrompt) {
        this.aiSystemPrompt = aiSystemPrompt;
    }
}

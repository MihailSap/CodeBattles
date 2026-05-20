package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;

@Entity
@Table(name = "solution_manual_text")
public class SolutionManualText extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "solution_id", nullable = false, unique = true)
    private Solution solution;

    private String fileName;

    private String language;

    private String content;

    public Solution getSolution() {
        return solution;
    }

    public void setSolution(Solution solution) {
        this.solution = solution;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}

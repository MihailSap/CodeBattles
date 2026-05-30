package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;

@Entity
@Table(name = "review_file_content")
public class ReviewFileContent extends BaseEntity {

    private String path;

    private String language;

    private Boolean isDiff;

    private String content;

    private String oldContent;

    private Boolean unsupportedPreview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_iteration_id")
    private ReviewIteration reviewIteration;

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Boolean getDiff() {
        return isDiff;
    }

    public void setDiff(Boolean diff) {
        isDiff = diff;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getOldContent() {
        return oldContent;
    }

    public void setOldContent(String oldContent) {
        this.oldContent = oldContent;
    }

    public Boolean getUnsupportedPreview() {
        return unsupportedPreview;
    }

    public void setUnsupportedPreview(Boolean unsupportedPreview) {
        this.unsupportedPreview = unsupportedPreview;
    }

    public ReviewIteration getReviewIteration() {
        return reviewIteration;
    }

    public void setReviewIteration(ReviewIteration reviewIteration) {
        this.reviewIteration = reviewIteration;
    }
}

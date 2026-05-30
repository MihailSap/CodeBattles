package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;

@Entity
@Table(name = "comment_report_data")
public class CommentReportData extends BaseEntity {

    private Long commentId;

    private String commentText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private Review review;

    @OneToOne
    @JoinColumn(name = "comment_report_id")
    private CommentReport commentReport;

    public Long getCommentId() {
        return commentId;
    }

    public void setCommentId(Long commentId) {
        this.commentId = commentId;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Review getReview() {
        return review;
    }

    public void setReview(Review review) {
        this.review = review;
    }

    public CommentReport getCommentReport() {
        return commentReport;
    }

    public void setCommentReport(CommentReport commentReport) {
        this.commentReport = commentReport;
    }
}

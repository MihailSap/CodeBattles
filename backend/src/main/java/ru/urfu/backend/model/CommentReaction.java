package ru.urfu.backend.model;

import jakarta.persistence.*;
import ru.urfu.backend.model.base.BaseEntity;
import ru.urfu.backend.model.enums.ReactionType;

@Entity
@Table(name = "comment_reaction")
public class CommentReaction extends BaseEntity {

    @Enumerated(EnumType.STRING)
    private ReactionType reaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    public ReactionType getReaction() {
        return reaction;
    }

    public void setReaction(ReactionType reaction) {
        this.reaction = reaction;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Comment getComment() {
        return comment;
    }

    public void setComment(Comment comment) {
        this.comment = comment;
    }
}

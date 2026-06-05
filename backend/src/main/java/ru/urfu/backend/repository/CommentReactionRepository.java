package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.CommentReaction;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ReactionType;

import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction> findByUserAndComment(User user, Comment comment);

    @Query("""
            select count(reaction)
            from CommentReaction reaction
            where reaction.comment.commentAuthorRole = :authorRole
              and reaction.reaction = :reactionType
            """)
    long countByCommentAuthorRoleAndReaction(CommentAuthorRole authorRole, ReactionType reactionType);
}

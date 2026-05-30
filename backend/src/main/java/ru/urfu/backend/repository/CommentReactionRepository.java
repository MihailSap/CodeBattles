package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.CommentReaction;
import ru.urfu.backend.model.User;

import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction> findByUserAndComment(User user, Comment comment);
}

package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
}

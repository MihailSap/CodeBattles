package ru.urfu.backend.service;

import ru.urfu.backend.dto.comment.*;
import ru.urfu.backend.model.*;

import java.util.Optional;

public interface CommentService {

    Comment getById(Long id);

    Comment getRootComment(Comment comment);

    int getReplyDepth(Comment comment);

    Optional<CommentReaction> getCommentReaction(User user, Comment comment);

    CommentReaction updateReaction(ToggleReactionRequest request, CommentReaction reaction);

    Comment createComment(CreateReviewCommentRequest request, User user, Review review);

    Comment createReply(CreateReplyRequest request, User user, Comment comment);

    CommentReport createReport(ReportCommentRequestDto request, User user, Comment comment);

    CommentReaction createReaction(ToggleReactionRequest request, User user, Comment comment);

    Comment updateState(UpdateThreadStateRequest request, User user, Comment comment);

    void delete(Comment comment);
}

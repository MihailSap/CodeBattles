package ru.urfu.backend.service;

import ru.urfu.backend.dto.comment.*;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.CommentAuthorRole;

import java.util.List;

public interface CommentService {

    Comment getById(Long id);

    Comment getRootComment(Comment comment);

    List<CommentReport> getAllActiveReports();

    CommentReport getReportById(Long id);

    int getReplyDepth(Comment comment);

    void toggleReaction(ToggleReactionRequest request, User user, Comment comment);

    Comment createComment(CreateReviewCommentRequest request, User user, Review review);

    Comment createReply(
            CreateReplyRequest request,
            User user,
            Comment comment,
            CommentAuthorRole authorRole,
            boolean revealName,
            Integer reviewerIndex
    );

    CommentReport createReport(ReportCommentRequestDto request, User user, Comment comment);

    Comment updateState(UpdateThreadStateRequest request, User user, Comment comment);

    CommentReport deactivateCommentReport(CommentReport report);

    void delete(Comment comment);
}

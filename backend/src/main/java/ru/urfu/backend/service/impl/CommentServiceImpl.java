package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.comment.*;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ThreadAction;
import ru.urfu.backend.repository.CommentReactionRepository;
import ru.urfu.backend.repository.CommentReportRepository;
import ru.urfu.backend.repository.CommentRepository;
import ru.urfu.backend.service.CommentService;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentReportRepository commentReportRepository;
    private final CommentReactionRepository commentReactionRepository;

    @Autowired
    public CommentServiceImpl(
            CommentRepository commentRepository,
            CommentReportRepository commentReportRepository,
            CommentReactionRepository commentReactionRepository
    ) {
        this.commentRepository = commentRepository;
        this.commentReportRepository = commentReportRepository;
        this.commentReactionRepository = commentReactionRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Comment getById(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Комментарий с id=%s не найден".formatted(id)));
    }

    @Transactional(readOnly = true)
    @Override
    public Comment getRootComment(Comment comment) {
        Comment current = comment;
        while(current.getParentComment() != null){
            current = current.getParentComment();
        }

        return current;
    }

    @Transactional(readOnly = true)
    @Override
    public int getReplyDepth(Comment comment) {
        int depth = 0;
        Comment current = comment;
        while(current.getParentComment() != null){
            depth++;
            current = current.getParentComment();
        }

        return depth;
    }

    @Transactional
    @Override
    public Comment createComment(CreateReviewCommentRequest request, User user, Review review) {
        Comment comment = new Comment();
        comment.setReviewIteration(review.getLastIteration());
        comment.setUser(user);
        comment.setCategory(request.category());
        comment.setFile(request.file());
        comment.setStartLine(request.startLine());
        comment.setEndLine(request.endLine());
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setRevealName(review.getRevealAuthorAfterReview());
        comment.setSeverity(request.severity());
        comment.setText(request.text());
        comment.setCommentAuthorRole(CommentAuthorRole.REVIEWER);

        return commentRepository.save(comment);
    }

    @Transactional
    @Override
    public Comment createReply(CreateReplyRequest request, User user, Comment comment) {
        Comment reply = new Comment();
        reply.setUser(user);
        reply.setReviewIteration(comment.getReviewIteration());
        reply.setParentComment(comment);
        reply.setText(request.text());
        reply.setRevealName(comment.getRevealName());
        reply.setUpdatedAt(LocalDateTime.now());

        return commentRepository.save(reply);
    }

    @Transactional
    @Override
    public CommentReport createReport(ReportCommentRequestDto request, User user, Comment comment) {
        CommentReport report = new CommentReport();
        report.setUser(user);
        report.setComment(comment);
        report.setMessage(request.message());
        report.setReason(request.reason());
        return commentReportRepository.save(report);
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<CommentReaction> getCommentReaction(User user, Comment comment) {
        return commentReactionRepository.findByUserAndComment(user, comment);
    }

    @Transactional
    @Override
    public CommentReaction updateReaction(ToggleReactionRequest request, CommentReaction reaction) {
        reaction.setReaction(request.reaction());
        return commentReactionRepository.save(reaction);
    }

    @Transactional
    @Override
    public CommentReaction createReaction(ToggleReactionRequest request, User user, Comment comment) {
        CommentReaction reaction = new CommentReaction();
        reaction.setUser(user);
        reaction.setComment(comment);
        reaction.setReaction(request.reaction());
        return commentReactionRepository.save(reaction);
    }

    @Transactional
    @Override
    public Comment updateState(UpdateThreadStateRequest request, User user, Comment comment) {
        if(ThreadAction.CLOSE.equals(request.action()) && comment.getClosedAt() == null){
            comment.setClosedAt(LocalDateTime.now());
            comment.setUpdatedAt(LocalDateTime.now());
        } else if(ThreadAction.REOPEN.equals(request.action()) && comment.getClosedAt() != null){
            comment.setClosedAt(null);
            comment.setUpdatedAt(LocalDateTime.now());
        }

        return comment;
    }

    @Transactional
    @Override
    public void delete(Comment comment) {
        commentRepository.delete(comment);
    }
}

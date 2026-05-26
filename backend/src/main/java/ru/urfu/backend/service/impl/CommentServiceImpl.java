package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.comment.*;
import ru.urfu.backend.exception.customEx.CommentNotFoundException;
import ru.urfu.backend.exception.customEx.ReportNotFoundException;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ThreadAction;
import ru.urfu.backend.repository.CommentReactionRepository;
import ru.urfu.backend.repository.CommentReportDataRepository;
import ru.urfu.backend.repository.CommentReportRepository;
import ru.urfu.backend.repository.CommentRepository;
import ru.urfu.backend.service.CommentService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentReportRepository commentReportRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final CommentReportDataRepository commentReportDataRepository;

    @Autowired
    public CommentServiceImpl(
            CommentRepository commentRepository,
            CommentReportRepository commentReportRepository,
            CommentReactionRepository commentReactionRepository,
            CommentReportDataRepository commentReportDataRepository
    ) {
        this.commentRepository = commentRepository;
        this.commentReportRepository = commentReportRepository;
        this.commentReactionRepository = commentReactionRepository;
        this.commentReportDataRepository = commentReportDataRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Comment getById(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new CommentNotFoundException("Комментарий с id=%s не найден".formatted(id)));
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

    @Override
    public List<CommentReport> getAllActiveReports() {
        return commentReportRepository.findAllByIsActiveTrue();
    }

    @Override
    public CommentReport getReportById(Long id) {
        return commentReportRepository.findById(id)
                .orElseThrow(() -> new ReportNotFoundException("Жалоба на комментарий с id=%s не найдена".formatted(id)));
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
        comment.setReviewerIndex(review.getReviewerIndex());
        comment.setSeverity(request.severity());
        comment.setText(request.text());
        comment.setCommentAuthorRole(CommentAuthorRole.REVIEWER);

        return commentRepository.save(comment);
    }

    @Transactional
    @Override
    public Comment createReply(
            CreateReplyRequest request,
            User user,
            Comment comment,
            CommentAuthorRole authorRole,
            boolean revealName,
            Integer reviewerIndex
    ) {
        Comment reply = new Comment();
        reply.setUser(user);
        reply.setReviewIteration(comment.getReviewIteration());
        reply.setParentComment(comment);
        reply.setText(request.text());
        reply.setRevealName(revealName);
        reply.setReviewerIndex(reviewerIndex);
        reply.setCommentAuthorRole(authorRole);
        reply.setUpdatedAt(LocalDateTime.now());

        return commentRepository.save(reply);
    }

    @Transactional
    @Override
    public CommentReport createReport(ReportCommentRequestDto request, User user, Comment comment) {
        CommentReport commentReport = new CommentReport();
        commentReport.setUser(user);
        commentReport.setMessage(request.message());
        commentReport.setReason(request.reason());
        commentReportRepository.save(commentReport);

        CommentReportData commentReportData = new CommentReportData();
        commentReportData.setCommentText(comment.getText());
        commentReportData.setCommentReport(commentReport);
        commentReportData.setUser(comment.getUser());
        commentReportData.setCommentId(comment.getId());
        commentReportData.setReview(comment.getReviewIteration().getReview());
        commentReportDataRepository.save(commentReportData);

        commentReport.setCommentReportData(commentReportData);

        return commentReport;
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
        } else if(ThreadAction.REOPEN.equals(request.action()) && comment.getClosedAt() != null){
            comment.setClosedAt(null);
        }

        comment.setUpdatedAt(LocalDateTime.now());
        return commentRepository.save(comment);
    }

    @Override
    public CommentReport deactivateCommentReport(CommentReport report) {
        report.setActive(false);
        return commentReportRepository.save(report);
    }

    @Transactional
    @Override
    public void delete(Comment comment) {
        for (CommentReport report : comment.getReports()) {
            if(report.getComment() != null){
                report.setComment(null);
            }
        }
        Comment parent = comment.getParentComment();
        if (parent != null) {
            parent.removeReply(comment);
        }
        commentRepository.delete(comment);
    }
}

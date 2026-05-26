package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.DeletedResponse;
import ru.urfu.backend.dto.comment.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.exception.globalEx.ForbiddenException;
import ru.urfu.backend.exception.globalEx.MaxDepthExceedException;
import ru.urfu.backend.mapper.CommentMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.TaskStatus;
import ru.urfu.backend.model.enums.ThreadAction;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.CommentService;
import ru.urfu.backend.service.ReviewService;
import ru.urfu.backend.service.TaskService;

import java.time.LocalDateTime;
import java.util.Optional;

@Tag(name = "Управление комментариями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.COMMENTS)
public class CommentController {

    private final AuthService authService;
    private final TaskService taskService;
    private final ReviewService reviewService;
    private final CommentService commentService;
    private final CommentMapper commentMapper;

    @Autowired
    public CommentController(
            AuthService authService,
            TaskService taskService,
            ReviewService reviewService,
            CommentService commentService,
            CommentMapper commentMapper
    ) {
        this.authService = authService;
        this.taskService = taskService;
        this.reviewService = reviewService;
        this.commentService = commentService;
        this.commentMapper = commentMapper;
    }

    @Operation(description = "Создание комментария")
    @PostMapping
    public ResponseEntity<ReviewCommentResponse> create(
            @RequestBody CreateReviewCommentRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Review review = reviewService.getById(request.reviewId());
        Task task = review.getTask();
        if(!user.equals(review.getUser())){
            throw new ForbiddenException("Комментировать могут только назначенные ревьюеры");
        }
        if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
            throw new ForbiddenException("Задача не находится в статусе IN_REVIEW");
        }
        if(ReviewStatus.COMPLETED.equals(review.getStatus())){
            throw new ForbiddenException("Ревью завершено");
        }
        Comment comment = commentService.createComment(request, user, review);
        if(ReviewStatus.NEW.equals(review.getStatus())){
            reviewService.updateStatusInProgress(review);
        }
        return ResponseEntity.status(201).body(commentMapper.mapToReviewCommentDto(comment));
    }

    @Operation(description = "Создание ответа на комментарий")
    @PostMapping("/{commentId}/reply")
    public ResponseEntity<ReviewCommentResponse> createReply(
            @PathVariable("commentId") Long commentId,
            @RequestBody CreateReplyRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Comment comment = commentService.getById(commentId);
        Comment rootComment = commentService.getRootComment(comment);
        Task task = comment.getReviewIteration().getReview().getTask();

        if(rootComment.getClosedAt() != null){
            throw new ForbiddenException("Тред закрыт");
        }

        int replyDepth = commentService.getReplyDepth(comment);
        if(replyDepth + 1 > 5){
            throw new MaxDepthExceedException("Превышена максимальная вложенность комментариев");
        }
        if(TaskStatus.DONE.equals(task.getStatus())
                && task.getCompletedAt() != null
                && task.getCompletedAt().plusDays(7).isBefore(LocalDateTime.now())){
            throw new ForbiddenException("Запрещено оставлять комментарии к завершенной задаче");
        }

        CommentAuthorRole commentAuthorRole;
        boolean revealName;
        Integer reviewerIndex = null;
        if(taskService.isUserReviewerInTask(user, task)){
            Review reviewerReview = reviewService.getByUserAndTask(user, task);
            if (TaskStatus.IN_REVIEW.equals(task.getStatus())
                    && !comment.getReviewIteration().getReview().getId().equals(reviewerReview.getId())) {
                throw new ForbiddenException("Во время проверки ревьюер может обсуждать только своё ревью");
            }
            commentAuthorRole = CommentAuthorRole.REVIEWER;
            revealName = reviewerReview.getRevealAuthorAfterReview();
            reviewerIndex = reviewerReview.getReviewerIndex();
        } else if(taskService.isUserAssigneeInTask(user, task)){
            if (TaskStatus.IN_REVIEW.equals(task.getStatus())) {
                throw new ForbiddenException("Исполнитель может отвечать после публикации результатов ревью");
            }
            commentAuthorRole = CommentAuthorRole.ASSIGNEE;
            revealName = task.getSolution().getRevealAuthorAfterReview();
        } else {
            throw new ForbiddenException(
                    "Оставлять комментарии могут только исполнители и ревьюеры данной задачи");
        }

        Comment reply = commentService.createReply(
                request,
                user,
                comment,
                commentAuthorRole,
                revealName,
                reviewerIndex
        );
        return ResponseEntity.status(201).body(commentMapper.mapToReviewCommentDto(reply));
    }

    @Operation(description = "Жалоба на комментарий")
    @PostMapping("/{commentId}/report")
    public ResponseEntity<ReportCommentResponse> report(
            @PathVariable("commentId") Long commentId,
            @RequestBody ReportCommentRequestDto request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Comment comment = commentService.getById(commentId);
        CommentReport report = commentService.createReport(request, user, comment);
        return ResponseEntity.status(201).body(commentMapper.mapToReportCommentResponse(report));
    }

    @Operation(description = "Изменение состояния треда")
    @PutMapping("/{commentId}/state")
    public ReviewCommentResponse updateState(
            @PathVariable("commentId") Long commentId,
            @RequestBody UpdateThreadStateRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Comment comment = commentService.getById(commentId);
        Task task = comment.getReviewIteration().getReview().getTask();

        if(ThreadAction.CLOSE.equals(request.action())){
            if(!TaskStatus.DONE.equals(task.getStatus()) && !TaskStatus.REWORK.equals(task.getStatus())){
                throw new ForbiddenException("Закрывать тред можно только в статусе DONE или REWORK");
            }
            if(!taskService.isUserAssigneeInTask(user, task)){
                throw new ForbiddenException("Закрывать тред может только исполнитель задачи");
            }
            if(comment.getClosedAt() != null){
                throw new ForbiddenException("Данный тред уже закрыт");
            }
        } else if(ThreadAction.REOPEN.equals(request.action())){
            if(!TaskStatus.REWORK.equals(task.getStatus())){
                throw new ForbiddenException("Переоткрывать тред можно только в статусе REWORK");
            }
            if(!user.equals(comment.getUser())){
                throw new ForbiddenException("Переоткрывать тред может только его автор");
            }
            if(comment.getClosedAt() == null){
                throw new ForbiddenException("Данный тред уже открыт");
            }
        }

        Comment updatedComment = commentService.updateState(request, user, comment);
        return commentMapper.mapToReviewCommentDto(updatedComment);
    }

    @Operation(description = "Создание реакции на комментарий")
    @PutMapping("/{commentId}/reaction")
    public ReviewCommentResponse updateReaction(
            @PathVariable("commentId") Long commentId,
            @RequestBody ToggleReactionRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Comment comment = commentService.getById(commentId);
        Comment rootComment = commentService.getRootComment(comment);
        if(comment.getParentComment() != null && rootComment.getClosedAt() != null){
            throw new ForbiddenException("Запрещено ставить реакцию на ответ в закрытом треде");
        }
        Optional<CommentReaction> commentReaction = commentService.getCommentReaction(user, comment);
        if(commentReaction.isPresent()){
            commentService.updateReaction(request, commentReaction.get());
        } else {
            commentService.createReaction(request, user, comment);
        }
        return commentMapper.mapToReviewCommentDto(comment);
    }

    @Operation(description = "Удаление комментария")
    @DeleteMapping("/{commentId}")
    public DeletedResponse delete(
            @PathVariable("commentId") Long commentId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Comment comment = commentService.getById(commentId);
        if(!user.equals(comment.getUser())){
            throw new ForbiddenException("Запрещено удалять чужие комментарии");
        }
        if (!comment.getReplies().isEmpty()){
            throw new ForbiddenException("Запрещено удалять комментарии с ответами");
        }

        commentService.delete(comment);
        return new DeletedResponse(true);
    }
}

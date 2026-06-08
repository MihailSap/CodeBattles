package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.PagedResponse;
import ru.urfu.backend.dto.admin.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.AdminMapper;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.CommentReport;
import ru.urfu.backend.model.CommentReportData;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.SystemSettings;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AdminEventService;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.CommentService;
import ru.urfu.backend.service.SystemSettingsService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Tag(name = "Методы для администратора")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.ADMIN)
public class AdminController {

    private final CommentService commentService;
    private final SystemSettingsService systemSettingsService;
    private final AdminMapper adminMapper;
    private final AuthService authService;
    private final AdminEventService adminEventService;

    @Autowired
    public AdminController(
            CommentService commentService,
            SystemSettingsService systemSettingsService,
            AdminMapper adminMapper,
            AuthService authService,
            AdminEventService adminEventService
    ) {
        this.commentService = commentService;
        this.systemSettingsService = systemSettingsService;
        this.adminMapper = adminMapper;
        this.authService = authService;
        this.adminEventService = adminEventService;
    }

    @Operation(description = "Получение жалоб на комментарии")
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/complaints/comments")
    public List<AdminCommentComplaintDto> getCommentReports(){
        List<CommentReport> reports = commentService.getAllActiveReports();
        return adminMapper.mapToAdminCommentComplaintDtos(reports);
    }

    @Operation(description = "Обработка жалобы на комментарий")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/complaints/comments/{complaintId}/decision")
    public ResolveAdminCommentComplaintResponse commentReportDecision(
            @PathVariable("complaintId") Long complaintId,
            @RequestBody ResolveAdminCommentComplaintRequest request
    ) throws UserNotFoundException {
        User admin = authService.getAuthenticatedUser();
        CommentReport commentReport = commentService.getReportById(complaintId);
        CommentReportContext reportContext = resolveCommentReportContext(commentReport);

        if(CommentReportDecision.REJECT.equals(request.decision())){
            commentService.deactivateCommentReport(commentReport);
            adminEventService.logCommentComplaintRejected(
                    admin,
                    reportContext.commentAuthor(),
                    reportContext.review(),
                    reportContext.commentId(),
                    reportContext.commentText(),
                    commentReport.getReason() != null ? commentReport.getReason().name() : null
            );
            return new ResolveAdminCommentComplaintResponse(
                    complaintId,
                    request.decision(),
                    "Комментарий не удален, баллы пользователя не сняты",
                    null,
                    null
            );
        } else {
            Long removedCommentId = reportContext.commentId();
            if (removedCommentId == null) {
                commentService.deactivateCommentReport(commentReport);
                return new ResolveAdminCommentComplaintResponse(
                        complaintId,
                        request.decision(),
                        "Комментарий уже недоступен, жалоба закрыта без штрафа",
                        null,
                        null
                );
            }
            Comment comment = commentService.getById(removedCommentId);
            commentService.delete(comment);
            commentService.deactivateCommentReport(commentReport);
            long previousApprovedComplaints = adminEventService.countApprovedComplaintsSince(
                    reportContext.commentAuthor(),
                    java.time.LocalDateTime.now().minusDays(14)
            );
            boolean shouldApplyPenalty = previousApprovedComplaints > 0;
            String consequence = shouldApplyPenalty
                    ? "Комментарий удалён, штраф -100 баллов"
                    : "Комментарий удалён, предупреждение без штрафа";
            adminEventService.logCommentComplaintApproved(
                    admin,
                    reportContext.commentAuthor(),
                    reportContext.review(),
                    reportContext.commentId(),
                    reportContext.commentText(),
                    commentReport.getReason() != null ? commentReport.getReason().name() : null,
                    consequence,
                    removedCommentId,
                    shouldApplyPenalty ? -100 : null
            );
            return new ResolveAdminCommentComplaintResponse(
                    complaintId,
                    request.decision(),
                    consequence,
                    removedCommentId,
                    shouldApplyPenalty ? -100 : null
            );
        }
    }

    private CommentReportContext resolveCommentReportContext(CommentReport commentReport) {
        CommentReportData reportData = commentReport.getCommentReportData();
        if (reportData != null) {
            return new CommentReportContext(
                    reportData.getCommentId(),
                    reportData.getCommentText(),
                    reportData.getUser(),
                    reportData.getReview()
            );
        }

        Comment comment = commentReport.getComment();
        if (comment == null) {
            return new CommentReportContext(
                    null,
                    "Комментарий недоступен",
                    null,
                    null
            );
        }

        Review review = comment.getReviewIteration() != null
                ? comment.getReviewIteration().getReview()
                : null;
        return new CommentReportContext(
                comment.getId(),
                comment.getText(),
                comment.getUser(),
                review
        );
    }

    private record CommentReportContext(
            Long commentId,
            String commentText,
            User commentAuthor,
            Review review
    ) {
    }

    @Operation(description = "Получение системных настроек")
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/system-settings")
    public AdminSystemSettingsDto getSystemSettings(){
        SystemSettings systemSettings = systemSettingsService.getSystemSettings();
        return adminMapper.mapToAdminSystemSettingsDto(systemSettings);
    }

    @Operation(description = "Обновление сроков на выполнение ревью")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/system-settings/review-deadline")
    public AdminSystemSettingsDto updateReviewDeadline(
            @RequestBody UpdateReviewDeadlineRequest request
    ) throws UserNotFoundException {
        User admin = authService.getAuthenticatedUser();
        SystemSettings systemSettings = systemSettingsService.getSystemSettings();
        String previousValue = systemSettings.getReviewDeadlineDays() + " дней";
        SystemSettings updatedSystemSettings = systemSettingsService.updateReviewDeadline(
                systemSettings, request.reviewDeadlineDays());
        String newValue = updatedSystemSettings.getReviewDeadlineDays() + " дней";
        adminEventService.logSystemReviewDeadlineChanged(admin, previousValue, newValue);
        return adminMapper.mapToAdminSystemSettingsDto(updatedSystemSettings);
    }

    @Operation(description = "Обновление системного промпта ИИ модели")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/system-settings/ai-system-prompt")
    public AdminSystemSettingsDto updateAiSystemPrompt(
            @RequestBody UpdateAiSystemPromptRequest request
    ) throws UserNotFoundException {
        User admin = authService.getAuthenticatedUser();
        SystemSettings systemSettings = systemSettingsService.getSystemSettings();
        String previousValue = systemSettings.getAiSystemPrompt();
        SystemSettings updatedSystemSettings = systemSettingsService.updateAiSystemPrompt(
                systemSettings, request.aiSystemPrompt());
        adminEventService.logSystemAiPromptChanged(admin, previousValue, request.aiSystemPrompt());
        return adminMapper.mapToAdminSystemSettingsDto(updatedSystemSettings);
    }

    @Operation(description = "Получение журнала событий администратора")
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/events")
    public PagedResponse<AdminEventDto> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ){
        LocalDateTime dateTimeFrom = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime dateTimeTo = dateTo != null ? dateTo.atTime(LocalTime.MAX) : null;
        return adminEventService.getEvents(page, size, type, dateTimeFrom, dateTimeTo);
    }
}

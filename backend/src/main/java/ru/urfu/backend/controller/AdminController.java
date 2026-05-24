package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.admin.*;
import ru.urfu.backend.mapper.AdminMapper;
import ru.urfu.backend.model.Comment;
import ru.urfu.backend.model.CommentReport;
import ru.urfu.backend.model.SystemSettings;
import ru.urfu.backend.service.CommentService;
import ru.urfu.backend.service.SystemSettingsService;

import java.util.List;

@Tag(name = "Методы для администратора")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.ADMIN)
public class AdminController {

    private final CommentService commentService;
    private final SystemSettingsService systemSettingsService;
    private final AdminMapper adminMapper;

    @Autowired
    public AdminController(
            CommentService commentService,
            SystemSettingsService systemSettingsService,
            AdminMapper adminMapper
    ) {
        this.commentService = commentService;
        this.systemSettingsService = systemSettingsService;
        this.adminMapper = adminMapper;
    }

    @Operation(description = "Получение жалоб на комментарии")
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/complaints/comments")
    public List<AdminCommentComplaintDto> getCommentReports(){
        List<CommentReport> reports = commentService.getAllReports();
        return adminMapper.mapToAdminCommentComplaintDtos(reports);
    }

    @Operation(description = "Обработка жалобы на комментарий")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/complaints/comments/{complaintId}/decision")
    public ResolveAdminCommentComplaintResponse commentReportDecision(
            @PathVariable("complaintId") Long complaintId,
            @RequestBody ResolveAdminCommentComplaintRequest request
    ){
        CommentReport commentReport = commentService.getReportById(complaintId);
        if(CommentReportDecision.REJECT.equals(request.decision())){
            commentService.deactivateCommentReport(commentReport);
            //TODO: Запись в журнал
            return new ResolveAdminCommentComplaintResponse(
                    complaintId,
                    request.decision(),
                    "Комментарий не удален, баллы пользователя не сняты",
                    null,
                    null
            );
        } else {
            Comment comment = commentReport.getComment();
            Long removedCommentId = comment.getId();
            commentService.delete(comment);
            commentService.deactivateCommentReport(commentReport);
            //TODO: Снятие баллов автора комментария
            //TODO: Запись в журнал
            return new ResolveAdminCommentComplaintResponse(
                    complaintId,
                    request.decision(),
                    "Комментарий удалён, у пользователя снято 100 баллов",
                    removedCommentId,
                    100
            );
        }
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
    public AdminSystemSettingsDto updateReviewDeadline(@RequestBody UpdateReviewDeadlineRequest request){
        SystemSettings systemSettings = systemSettingsService.getSystemSettings();
        SystemSettings updatedSystemSettings = systemSettingsService.updateReviewDeadline(
                systemSettings, request.reviewDeadlineDays());
        return adminMapper.mapToAdminSystemSettingsDto(updatedSystemSettings);
    }

    @Operation(description = "Обновление системного промпта ИИ модели")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/system-settings/ai-system-prompt")
    public AdminSystemSettingsDto updateAiSystemPrompt(@RequestBody UpdateAiSystemPromptRequest request){
        SystemSettings systemSettings = systemSettingsService.getSystemSettings();
        SystemSettings updatedSystemSettings = systemSettingsService.updateAiSystemPrompt(
                systemSettings, request.aiSystemPrompt());
        return adminMapper.mapToAdminSystemSettingsDto(updatedSystemSettings);
    }
}

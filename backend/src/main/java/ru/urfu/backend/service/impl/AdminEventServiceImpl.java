package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.PagedResponse;
import ru.urfu.backend.dto.admin.*;
import ru.urfu.backend.model.AdminEvent;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.Task;
import ru.urfu.backend.model.User;
import ru.urfu.backend.repository.AdminEventRepository;
import ru.urfu.backend.service.AdminEventService;
import ru.urfu.backend.specification.AdminEventSpecification;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class AdminEventServiceImpl implements AdminEventService {

    private final AdminEventRepository adminEventRepository;
    private final AdminEventSpecification adminEventSpecification;

    @Autowired
    public AdminEventServiceImpl(
            AdminEventRepository adminEventRepository,
            AdminEventSpecification adminEventSpecification
    ) {
        this.adminEventRepository = adminEventRepository;
        this.adminEventSpecification = adminEventSpecification;
    }

    @Transactional(readOnly = true)
    @Override
    public PagedResponse<AdminEventDto> getEvents(
            int page,
            int size,
            String type,
            LocalDateTime dateFrom,
            LocalDateTime dateTo
    ) {
        Specification<AdminEvent> spec = adminEventSpecification.filter(type, dateFrom, dateTo);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminEventDto> events = adminEventRepository.findAll(spec, pageable).map(this::mapToDto);
        return new PagedResponse<>(
                events.getContent(),
                events.getTotalElements(),
                events.getTotalPages(),
                events.getNumber(),
                events.getSize()
        );
    }

    @Transactional(readOnly = true)
    @Override
    public long countApprovedComplaints(User targetUser) {
        return adminEventRepository.countByTypeAndTargetUser("COMMENT_COMPLAINT_APPROVED", targetUser);
    }

    @Transactional(readOnly = true)
    @Override
    public long countApprovedComplaintsSince(User targetUser, LocalDateTime since) {
        return adminEventRepository.countByTypeAndTargetUserAndCreatedAtAfter(
                "COMMENT_COMPLAINT_APPROVED", targetUser, since);
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<LocalDateTime> getLastLeaderboardRatingResetAt(User targetUser) {
        return adminEventRepository.findFirstByTypeAndTargetUserOrderByCreatedAtDesc(
                        "LEADERBOARD_RATING_RESET", targetUser)
                .map(AdminEvent::getCreatedAt);
    }

    @Transactional(readOnly = true)
    @Override
    public int sumPenaltyPointsSince(User targetUser, LocalDateTime since) {
        return adminEventRepository.findByTypeAndTargetUserAndCreatedAtAfter(
                        "COMMENT_COMPLAINT_APPROVED", targetUser, since)
                .stream()
                .map(AdminEvent::getPenaltyPoints)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
    }

    @Transactional
    @Override
    public void logCommentComplaintCreated(User reporter, User commentAuthor, Review review, Long commentId,
                                            String commentTextPreview, String reason) {
        AdminEvent event = new AdminEvent();
        event.setType("COMMENT_COMPLAINT_CREATED");
        event.setActor(reporter);
        event.setTargetUser(commentAuthor);
        event.setCommentId(commentId);
        event.setCommentTextPreview(truncate(commentTextPreview, 200));
        event.setReason(formatReportReason(reason));
        setComplaintTarget(event, review);
        adminEventRepository.save(event);
    }

    @Transactional
    @Override
    public void logCommentComplaintApproved(User admin, User commentAuthor, Review review, Long commentId,
                                             String commentTextPreview, String reason,
                                             String consequence, Long removedCommentId,
                                             Integer penaltyPoints) {
        AdminEvent event = new AdminEvent();
        event.setType("COMMENT_COMPLAINT_APPROVED");
        event.setActor(admin);
        event.setTargetUser(commentAuthor);
        event.setCommentId(commentId);
        event.setCommentTextPreview(truncate(commentTextPreview, 200));
        event.setReason(formatReportReason(reason));
        event.setConsequence(consequence);
        event.setRemovedCommentId(removedCommentId);
        event.setPenaltyPoints(penaltyPoints);
        event.setDecision("Подтверждена");
        setComplaintTarget(event, review);
        adminEventRepository.save(event);
    }

    @Transactional
    @Override
    public void logCommentComplaintRejected(User admin, User commentAuthor, Review review, Long commentId,
                                             String commentTextPreview, String reason) {
        AdminEvent event = new AdminEvent();
        event.setType("COMMENT_COMPLAINT_REJECTED");
        event.setActor(admin);
        event.setTargetUser(commentAuthor);
        event.setCommentId(commentId);
        event.setCommentTextPreview(truncate(commentTextPreview, 200));
        event.setReason(formatReportReason(reason));
        event.setDecision("Отклонена");
        setComplaintTarget(event, review);
        adminEventRepository.save(event);
    }

    @Transactional
    @Override
    public LocalDateTime logLeaderboardRatingReset(User admin, User targetUser, String reason) {
        AdminEvent event = new AdminEvent();
        event.setType("LEADERBOARD_RATING_RESET");
        event.setActor(admin);
        event.setTargetUser(targetUser);
        LocalDateTime resetAt = LocalDateTime.now();
        event.setCreatedAt(resetAt);
        event.setDetails(reason == null || reason.isBlank()
                ? "Рейтинг пользователя обнулен"
                : "Рейтинг пользователя обнулен. Причина: " + reason);
        event.setScopeType("GLOBAL");
        event.setScopeName("Глобальный лидерборд");
        event.setScopeUrl("/leaderboard");
        adminEventRepository.save(event);
        return resetAt;
    }

    @Transactional
    @Override
    public void logSystemReviewDeadlineChanged(User admin, String previousValue, String newValue) {
        AdminEvent event = new AdminEvent();
        event.setType("SYSTEM_REVIEW_DEADLINE_CHANGED");
        event.setActor(admin);
        event.setPreviousValue(previousValue);
        event.setNewValue(newValue);
        event.setScopeType("GLOBAL");
        event.setScopeName("Система");
        adminEventRepository.save(event);
    }

    @Transactional
    @Override
    public void logSystemAiPromptChanged(User admin, String previousValue, String newValue) {
        AdminEvent event = new AdminEvent();
        event.setType("SYSTEM_AI_PROMPT_CHANGED");
        event.setActor(admin);
        event.setPreviousValue(truncate(previousValue, 120));
        event.setNewValue(truncate(newValue, 120));
        event.setScopeType("GLOBAL");
        event.setScopeName("Система");
        adminEventRepository.save(event);
    }

    private void setComplaintTarget(AdminEvent event, Review review) {
        if (review == null) {
            return;
        }
        Task task = review.getTask();
        Project project = task.getProject();
        event.setTargetTitle(task.getTitle());
        event.setTargetUrl("/reviews/" + review.getId());
        event.setTargetProjectId(project.getId());
        event.setTargetTaskId(task.getId());
        event.setTargetReviewId(review.getId());
    }

    private AdminEventDto mapToDto(AdminEvent event) {
        AdminUserBriefDto actorDto = null;
        if (event.getActor() != null) {
            actorDto = new AdminUserBriefDto(
                    event.getActor().getId(),
                    event.getActor().getLogin(),
                    event.getActor().getFullName()
            );
        }

        AdminUserBriefDto targetUserDto = null;
        if (event.getTargetUser() != null) {
            targetUserDto = new AdminUserBriefDto(
                    event.getTargetUser().getId(),
                    event.getTargetUser().getLogin(),
                    event.getTargetUser().getFullName()
            );
        }

        AdminComplaintTargetDto targetDto = null;
        if (event.getTargetTitle() != null || event.getTargetUrl() != null
                || event.getTargetProjectId() != null || event.getTargetTaskId() != null
                || event.getTargetReviewId() != null) {
            targetDto = new AdminComplaintTargetDto(
                    event.getTargetReviewId() != null ? "review" : "task",
                    event.getTargetTitle(),
                    event.getTargetUrl(),
                    event.getTargetProjectId(),
                    event.getTargetTaskId(),
                    event.getTargetReviewId()
            );
        }

        AdminEventScopeDto scopeDto = null;
        if (event.getScopeName() != null || event.getScopeUrl() != null) {
            scopeDto = new AdminEventScopeDto(
                    event.getScopeType(),
                    event.getScopeName(),
                    event.getScopeUrl(),
                    event.getScopeOrganizationId(),
                    event.getScopeProjectId()
            );
        }

        return new AdminEventDto(
                event.getId(),
                event.getType(),
                event.getCreatedAt(),
                actorDto,
                targetUserDto,
                targetDto,
                formatReportReason(event.getReason()),
                event.getDecision(),
                event.getConsequence(),
                event.getCommentId(),
                event.getCommentTextPreview(),
                event.getRemovedCommentId(),
                event.getPenaltyPoints(),
                event.getDetails(),
                scopeDto,
                event.getPreviousValue(),
                event.getNewValue()
        );
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) + "..." : value;
    }

    private String formatReportReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return null;
        }

        return switch (reason) {
            case "OFFENSIVE" -> "Оскорбительное содержание";
            case "SPAM" -> "Спам";
            case "IRRELEVANT" -> "Не относится к обсуждению";
            case "INCORRECT" -> "Некорректная информация";
            case "DISCLOSES_IDENTITY" -> "Раскрытие личности";
            case "OTHER" -> "Другая причина";
            default -> reason;
        };
    }
}

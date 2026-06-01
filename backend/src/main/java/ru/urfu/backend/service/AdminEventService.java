package ru.urfu.backend.service;

import ru.urfu.backend.dto.admin.AdminEventDto;
import ru.urfu.backend.dto.PagedResponse;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.User;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AdminEventService {

    PagedResponse<AdminEventDto> getEvents(int page, int size, String type, LocalDateTime dateFrom, LocalDateTime dateTo);

    long countApprovedComplaints(User targetUser);

    long countApprovedComplaintsSince(User targetUser, LocalDateTime since);

    Optional<LocalDateTime> getLastLeaderboardRatingResetAt(User targetUser);

    int sumPenaltyPointsSince(User targetUser, LocalDateTime since);

    void logCommentComplaintCreated(User reporter, User commentAuthor, Review review, Long commentId,
                                    String commentTextPreview, String reason);

    void logCommentComplaintApproved(User admin, User commentAuthor, Review review, Long commentId,
                                     String commentTextPreview, String reason,
                                     String consequence, Long removedCommentId,
                                     Integer penaltyPoints);

    void logCommentComplaintRejected(User admin, User commentAuthor, Review review, Long commentId,
                                     String commentTextPreview, String reason);

    LocalDateTime logLeaderboardRatingReset(User admin, User targetUser, String reason);

    void logSystemReviewDeadlineChanged(User admin, String previousValue, String newValue);

    void logSystemAiPromptChanged(User admin, String previousValue, String newValue);
}

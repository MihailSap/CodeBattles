package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.review.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.ReviewMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.*;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.ReviewService;
import ru.urfu.backend.service.TaskService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Tag(name = "Управление ревью задач")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.REVIEWS)
public class ReviewController {

    private final AuthService authService;
    private final ProjectService projectService;
    private final ReviewService reviewService;
    private final TaskService taskService;
    private final ReviewMapper reviewMapper;

    @Autowired
    public ReviewController(
            AuthService authService,
            ProjectService projectService,
            ReviewService reviewService,
            TaskService taskService,
            ReviewMapper reviewMapper
    ) {
        this.authService = authService;
        this.projectService = projectService;
        this.reviewService = reviewService;
        this.taskService = taskService;
        this.reviewMapper = reviewMapper;
    }

    @Operation(description = "Получение списка ревью текущего пользователя")
    @GetMapping
    public List<ReviewListItemDto> getReviews() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Review> reviews = reviewService.getReviewsByUser(user);
        return reviewMapper.mapToReviewListItemDto(reviews);
    }

    @Operation(description = "Получение деталей ревью")
    @GetMapping("/{reviewId}")
    public ReviewDetailsResponse getById(
            @PathVariable("reviewId") Long reviewId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Review review = reviewService.getById(reviewId);
        Task task = review.getTask();
        if(!user.equals(review.getUser()) && !Role.ADMIN.equals(user.getRole())) {
            throw new RuntimeException("403 FORBIDDEN_REVIEW");
        }
        if(task.getSolution() == null){
            throw new RuntimeException("Решение отсутствует");
        }
        PermissionsResponse permissionsResponse = new PermissionsResponse( //FIXME
                true,
                true,
                true,
                true,
                true,
                true
        );
        boolean canViewAggregated =
                canViewAggregatedReview(task.getStatus(), true);

        if (canViewAggregated) {
            return reviewMapper.mapToReviewDetailsResponseByTask(
                    review,
                    permissionsResponse
            );
        }

        return reviewMapper.mapToReviewDetailsResponse(
                review,
                permissionsResponse
        );
//        return reviewMapper.mapToReviewDetailsResponseByTask(review, permissionsResponse);
    }

    @Operation(description = "Отправка итогового ревью")
    @PostMapping("/{reviewId}/verdict")
    public ResponseEntity<SubmitFinalReviewResponse> submitFinalReview(
            @PathVariable("reviewId") Long reviewId,
            @RequestBody SubmitFinalReviewRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Review review = reviewService.getById(reviewId);
        if(!user.equals(review.getUser())){
            throw new RuntimeException("Запрещено завершать чужие ревью");
        }
        if(ReviewStatus.COMPLETED.equals(review.getStatus())){
            throw new RuntimeException("Запрещено отправить вердикт на завершенное ревью");
        }
        if(review.getLastIteration().getDeadline().isBefore(LocalDateTime.now())){
            throw new RuntimeException("Дедлайн данного ревью истёк, отправка невозможна");
        }

        ReviewVerdict reviewVerdict = reviewService.createVerdict(request, review);
        Review updatedReview = reviewService.updateStatusCompleted(review);
        Review secondUpdatedReview = reviewService.updateRevealName(request.revealName(), updatedReview);

        boolean hasUncompletedReview = false;
        boolean hasRework = false;

        Task task = review.getTask();
        for(Review taskReview : task.getReviews()){
            ReviewVerdict reviewVerdict1 = taskReview.getLastIteration().getReviewVerdict();
            if(reviewVerdict1 == null){
                hasUncompletedReview = true;
            } else if(ReviewVerdictType.REWORK.equals(reviewVerdict1.getVerdict())){
                hasRework = true;
            }
        }
        if(!hasUncompletedReview && hasRework){
            taskService.updateStatusRework(task);
        }

        return ResponseEntity.status(201).body(reviewMapper.mapToSubmitFinalReviewResponse(secondUpdatedReview));
    }

    @GetMapping("/{reviewId}/files")
    public List<ReviewFileContentResponse> getReviewFileContentDto(
            @PathVariable("reviewId") Long reviewId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Review review = reviewService.getById(reviewId);
        Project project = review.getTask().getProject();
        if(!user.equals(review.getUser())
                && !Role.ADMIN.equals(user.getRole())
                && !projectService.isUserOwnerInProject(project, user)) {
            throw new RuntimeException("403 FORBIDDEN_REVIEW");
        }
        return reviewMapper.mapToReviewFileContentResponses(review.getLastIteration());
    }

    @Operation(description = "Получение ревью по задаче")
    @GetMapping("/by-task/{taskId}")
    public ReviewDetailsResponse getByTask(
            @PathVariable("taskId") Long taskId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Project project = task.getProject();

        if (!projectService.isUserOwnerInProject(project, user)
                && !taskService.isUserAssigneeInTask(user, task)) {
            throw new RuntimeException("403_FORBIDDEN_TASK");
        }
        if (task.getSolution() == null) {
            throw new RuntimeException("Решение отсутствует");
        }

        Set<Review> reviews = task.getReviews();
        if (reviews.isEmpty()) {
            throw new RuntimeException("Ревью в данной задаче отсутствует");
        }
        Review review = reviews.iterator().next();

        PermissionsResponse permissionsResponse = new PermissionsResponse(
                true,
                true,
                true,
                true,
                true,
                true
        );

        boolean canViewAggregated =
                canViewAggregatedReview(task.getStatus(), false);

        if (canViewAggregated) {
            return reviewMapper.mapToReviewDetailsResponseByTask(
                    review,
                    permissionsResponse
            );
        }

        return reviewMapper.mapToReviewDetailsResponse(
                review,
                permissionsResponse
        );
//        return reviewMapper.mapToReviewDetailsResponseByTask(review, permissionsResponse);
    }

    private boolean canViewAggregatedReview(TaskStatus status, boolean reviewerView) {
        if (reviewerView) {
            return TaskStatus.DONE.equals(status);
        }

        return TaskStatus.DONE.equals(status)
                || TaskStatus.REWORK.equals(status);
    }
}

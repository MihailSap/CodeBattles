package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.review.ReviewDetailsDto;
import ru.urfu.backend.dto.review.ReviewFileContentDto;
import ru.urfu.backend.dto.review.ReviewListItemDto;
import ru.urfu.backend.dto.review.ReviewResendRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.ReviewMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.SolutionUploadType;
import ru.urfu.backend.model.enums.TaskStatus;
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
    private final ReviewService reviewService;
    private final TaskService taskService;
    private final ProjectService projectService;
    private final ReviewMapper reviewMapper;

    @Autowired
    public ReviewController(
            AuthService authService,
            ReviewService reviewService,
            TaskService taskService,
            ProjectService projectService,
            ReviewMapper reviewMapper
    ) {
        this.authService = authService;
        this.reviewService = reviewService;
        this.taskService = taskService;
        this.projectService = projectService;
        this.reviewMapper = reviewMapper;
    }

    @Operation(description = "Повторная отправка задачи на ревью")
    @PostMapping("/resend")
    public ResponseEntity<SolutionSubmitResponse> reviewResend(
            @RequestBody ReviewResendRequest request
    ) throws UserNotFoundException {
        Long taskId = request.taskId();
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Solution solution = task.getSolution();
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new RuntimeException("403 FORBIDDEN_TASK");
        }
        if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
            throw new RuntimeException("Задача должна находиться в статусе IN_REVIEW");
        }
        if(!ReviewType.MANUAL_ASSIGNEES.equals(task.getReviewType())){
            throw new RuntimeException("Задача должна иметь тип ревью MANUAL_ASSIGNEES");
        }

        for(Review review : task.getReviews()){
            if(!review.getDeadline().isBefore(LocalDateTime.now())){
                throw new RuntimeException("Дедлайн по ревью ещё не истёк");
            }
        }

        reviewService.create(request.reviewerIds(), solution);

        SolutionSubmitResponse response = new SolutionSubmitResponse(
                taskId,
                task.getStatus(),
                ReviewStatus.NEW,
                solution.getUploadedAt().toString(),
                LocalDateTime.now().plusDays(14).toString()
        );

        return ResponseEntity.status(201).body(response);
    }

    @Operation(description = "Получение списка ревью текущего пользователя")
    @GetMapping
    public List<ReviewListItemDto> getReviews() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Review> reviews = reviewService.getByUser(user);
        return reviewMapper.mapToReviewListItemDto(reviews);
    }

    @Operation(description = "Получение деталей ревью")
    @GetMapping("/{reviewId}")
    public ReviewDetailsDto getById(
            @PathVariable("reviewId") Long reviewId
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Review review = reviewService.getById(reviewId);
        Task task = review.getTask();
        if(!taskService.isUserReviewerInTask(user, task)) {
            throw new RuntimeException("403 FORBIDDEN_REVIEW");
        }
        return reviewMapper.mapToReviewDetailsDto(review);
    }

//    @GetMapping("/{reviewId}/file")
//    public ReviewFileContentDto getReviewFileContentDto(
//            @PathVariable("reviewId") Long reviewId
//    ) throws UserNotFoundException {
//        User user = authService.getAuthenticatedUser();
//        Review review = reviewService.getById(reviewId);
//        Task task = review.getTask();
//        if(!taskService.isUserReviewerInTask(user, task)) {
//            throw new RuntimeException("403 FORBIDDEN_REVIEW");
//        }
//        Solution solution = review.getSolution();
//        if(SolutionUploadType.MANUAL_TEXT.equals(solution.getUploadType())){
//            SolutionManualText solutionManualText = solution.getSolutionManualText();
//            return new ReviewFileContentDto(
//                    "",
//                    solutionManualText.getLanguage(),
//                    false,
//                    solutionManualText.getContent(),
//                    solutionManualText.getContent(),
//
//            );
//        } else {
//            throw new RuntimeException("Этот тип данных ещё не поддерживается");
//        }
//    }

//    @Operation(description = "Получение ревью по задаче")
//    @GetMapping("/by-task/{taskId}")
//    public ReviewDetailsDto getByTask(
//            @PathVariable("taskId") Long taskId
//    ) throws UserNotFoundException {
//        User user = authService.getAuthenticatedUser();
//        Task task = taskService.getById(taskId);
//        Project project = task.getProject();
//        if(!projectService.isUserOwnerInProject(project, user)
//                && !taskService.isUserAssigneeInTask(user, task)) {
//            throw new RuntimeException("403_FORBIDDEN_TASK");
//        }
//        if(task.getSolution() == null){
//            throw new RuntimeException("Решение отсутствует");
//        }
//
//        Set<Review> reviews = task.getReviews();
//
//    }
}

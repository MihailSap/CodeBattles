package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.review.ReviewResendRequest;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewRequest;
import ru.urfu.backend.dto.solution.RevealAuthorAfterReviewResponse;
import ru.urfu.backend.dto.solution.SolutionSubmitRequest;
import ru.urfu.backend.dto.solution.SolutionSubmitResponse;
import ru.urfu.backend.dto.solution.GithubPullRequestOptionResponse;
import ru.urfu.backend.exception.customEx.ForbiddenTaskException;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.exception.globalEx.ForbiddenException;
import ru.urfu.backend.mapper.SolutionMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.*;
import ru.urfu.backend.service.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Управление решениями задач")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.SOLUTIONS)
public class SolutionController {

    private final AuthService authService;
    private final UserService userService;
    private final TaskService taskService;
    private final SolutionService solutionService;
    private final ReviewService reviewService;
    private final SolutionMapper solutionMapper;
    private final GithubClient githubClient;

    @Autowired
    public SolutionController(
            AuthService authService,
            UserService userService,
            TaskService taskService,
            SolutionService solutionService,
            ReviewService reviewService,
            SolutionMapper solutionMapper,
            GithubClient githubClient
    ) {
        this.authService = authService;
        this.userService = userService;
        this.taskService = taskService;
        this.solutionService = solutionService;
        this.reviewService = reviewService;
        this.solutionMapper = solutionMapper;
        this.githubClient = githubClient;
    }

    @Operation(description = "Открытые public pull request привязанного GitHub аккаунта")
    @GetMapping("/github/pull-requests")
    public List<GithubPullRequestOptionResponse> getLinkedGithubPullRequests() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        if (user.getGithubId() == null || user.getGithubId().isBlank()) {
            return List.of();
        }
        String githubLogin = user.getGithubLogin();
        if (githubLogin == null || githubLogin.isBlank()) {
            githubLogin = githubClient.fetchLoginByGithubId(user.getGithubId());
            user.setGithubLogin(githubLogin);
            userService.save(user);
        }
        return githubClient.fetchOpenPullRequestsByAuthor(githubLogin);
    }

    @Operation(description = "Первичная отправка решения в multipart-формате")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<SolutionSubmitResponse> submitSolutionMultipart(
            @ModelAttribute SolutionSubmitRequest request
    ) throws Exception {
        return submitSolution(request);
    }

    @Operation(description = "Первичная отправка файлового решения в JSON-формате")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<SolutionSubmitResponse> submitSolutionJson(
            @RequestBody SolutionSubmitRequest request
    ) throws Exception {
        return submitSolution(request);
    }

    private ResponseEntity<SolutionSubmitResponse> submitSolution(
            SolutionSubmitRequest request
    ) throws Exception {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(request.taskId());
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new ForbiddenException("Пользователь не является исполнителем данной задачи");
        }
        if(!TaskStatus.IN_PROGRESS.equals(task.getStatus())){
            throw new ForbiddenException("Задача не находится в статусе IN_PROGRESS");
        }
        if(task.getSolution() != null){
            throw new ForbiddenException("Для данной задачи уже создано решение");
        }
        if(SolutionUploadType.MANUAL_TEXT.equals(request.uploadType())){
            Solution solution = solutionService.createManualTextSolution(request, task);
            int reviewerIndex = 1;
            for(UserTask userTask : task.getUsers()){
                if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                    reviewService.create(userTask.getUser(), solution, reviewerIndex);
                    reviewerIndex++;
                }
            }
            taskService.updateStatusInReview(task);
            return ResponseEntity.status(201).body(
                    solutionMapper.mapToSolutionSubmitResponse(
                            solution, ReviewStatus.NEW, solution.getUploadedAt().plusDays(14).toString()));
        } else if(SolutionUploadType.GIT_PULL_REQUEST.equals(request.uploadType())){
            Solution solution = solutionService.createSolutionForGitPullRequest(request, task);
            int reviewerIndex = 1;
            for(UserTask userTask : task.getUsers()){
                if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                    reviewService.create(userTask.getUser(), solution, reviewerIndex);
                    reviewerIndex++;
                }
            }
            taskService.updateStatusInReview(task);
            return ResponseEntity.status(201).body(
                    solutionMapper.mapToSolutionSubmitResponse(
                            solution, ReviewStatus.NEW, solution.getUploadedAt().plusDays(14).toString()));
        } else if (SolutionUploadType.FILES.equals(request.uploadType())
                || SolutionUploadType.ARCHIVE.equals(request.uploadType())) {
            Solution solution = solutionService.createStoredFilesSolution(request, task);
            int reviewerIndex = 1;
            for (UserTask userTask : task.getUsers()) {
                if (UserTaskType.REVIEWER.equals(userTask.getUserTaskType())) {
                    reviewService.create(userTask.getUser(), solution, reviewerIndex);
                    reviewerIndex++;
                }
            }
            taskService.updateStatusInReview(task);
            return ResponseEntity.status(201).body(
                    solutionMapper.mapToSolutionSubmitResponse(
                            solution, ReviewStatus.NEW, solution.getUploadedAt().plusDays(14).toString()));
        }
        else {
            throw new ForbiddenException("Этот тип данных не поддерживается");
        }
    }

    @Operation(description = "Повторная отправка решения после доработки в multipart-формате")
    @PostMapping(value = "/resubmit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional(rollbackFor = Exception.class)
    public SolutionSubmitResponse resubmitMultipart(
            @ModelAttribute SolutionSubmitRequest request
    ) throws Exception {
        return resubmit(request);
    }

    @Operation(description = "Повторная отправка файлового решения после доработки в JSON-формате")
    @PostMapping(value = "/resubmit", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional(rollbackFor = Exception.class)
    public SolutionSubmitResponse resubmitJson(
            @RequestBody SolutionSubmitRequest request
    ) throws Exception {
        return resubmit(request);
    }

    private SolutionSubmitResponse resubmit(
            SolutionSubmitRequest request
    ) throws Exception {
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(request.taskId());
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new ForbiddenException("Пользователь не является исполнителем данной задачи");
        }
        task = taskService.resolveReviewOutcome(task);
        if(!TaskStatus.REWORK.equals(task.getStatus())){
            throw new ForbiddenException("Задача не находится в статусе REWORK");
        }

        Solution solution = task.getSolution();
        if(SolutionUploadType.MANUAL_TEXT.equals(request.uploadType())){
            Solution updatedSolution = solutionService.updateManualTextSolution(request, solution);
            if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
                taskService.updateStatusInReview(task);
            }
            for(Review review : updatedSolution.getReviews()){
                Review updatedReview = reviewService.updateStatusInProgress(review);
                ReviewIteration previousIteration = updatedReview.getLastIteration();
                ReviewIteration currentIteration = reviewService.createReviewIteration(updatedReview);

                reviewService.updateReviewFileContent(
                        previousIteration,
                        currentIteration,
                        updatedSolution.getSolutionManualText());
            }
            return solutionMapper.mapToSolutionSubmitResponse(
                    updatedSolution, ReviewStatus.IN_PROGRESS,
                    updatedSolution.getUploadedAt().plusDays(14).toString());
        } else if (SolutionUploadType.GIT_PULL_REQUEST.equals(request.uploadType())){
            Solution updatedSolution = solutionService.updateSolutionGitPullRequest(request, solution);
            if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
                taskService.updateStatusInReview(task);
            }
            for(Review review : updatedSolution.getReviews()){
                Review updatedReview = reviewService.updateStatusInProgress(review);
                ReviewIteration currentIteration = reviewService.createReviewIteration(updatedReview);

                reviewService.createReviewFileContent(
                        currentIteration,
                        updatedSolution.getSolutionGitPullRequest());
            }
            return solutionMapper.mapToSolutionSubmitResponse(
                    updatedSolution, ReviewStatus.IN_PROGRESS,
                    updatedSolution.getUploadedAt().plusDays(14).toString());
        } else if (SolutionUploadType.FILES.equals(request.uploadType())
                || SolutionUploadType.ARCHIVE.equals(request.uploadType())) {
            Solution updatedSolution = solutionService.updateStoredFilesSolution(request, solution);
            if (!TaskStatus.IN_REVIEW.equals(task.getStatus())) {
                taskService.updateStatusInReview(task);
            }
            for (Review review : updatedSolution.getReviews()) {
                Review updatedReview = reviewService.updateStatusInProgress(review);
                ReviewIteration previousIteration = updatedReview.getLastIteration();
                ReviewIteration currentIteration = reviewService.createReviewIteration(updatedReview);
                reviewService.updateReviewFileContents(
                        previousIteration,
                        currentIteration,
                        updatedSolution.getSolutionFiles());
            }
            return solutionMapper.mapToSolutionSubmitResponse(
                    updatedSolution, ReviewStatus.IN_PROGRESS,
                    updatedSolution.getUploadedAt().plusDays(14).toString());
        } else {
            throw new ForbiddenException("Такой тип данных не поддерживается");
        }
    }

    @Operation(description = "Обновление флага раскрытия имени автора во время ожидания")
    @PatchMapping("/author-visibility")
    public RevealAuthorAfterReviewResponse revealAuthorAfterReview(
            @RequestBody RevealAuthorAfterReviewRequest request
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Solution solution = solutionService.getById(request.solutionId());
        Task task = solution.getTask();
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new ForbiddenException("Пользователь не является исполнителем данной задачи");
        }
        if(!TaskStatus.IN_REVIEW.equals(task.getStatus())
                && !TaskStatus.REWORK.equals(task.getStatus())){
            throw new ForbiddenException("Задача должна находиться в статусе IN_REVIEW или REWORK");
        }
        Solution updatedSolution = solutionService.revealAuthor(solution, request);
        return solutionMapper.mapToRevealAuthorAfterReviewResponse(updatedSolution);
    }

    @Operation(description = "Ручная отправка задачи на ревью")
    @PostMapping("/resend")
    public ResponseEntity<SolutionSubmitResponse> resend(
            @RequestBody ReviewResendRequest request
    ) throws Exception {
        Long taskId = request.taskId();
        User user = authService.getAuthenticatedUser();
        Task task = taskService.getById(taskId);
        Solution solution = task.getSolution();
        if(!taskService.isUserAssigneeInTask(user, task)){
            throw new ForbiddenTaskException("403 FORBIDDEN_TASK");
        }
        if(!TaskStatus.IN_REVIEW.equals(task.getStatus())){
            throw new ForbiddenException("Задача должна находиться в статусе IN_REVIEW");
        }
        if(!ReviewType.MANUAL_ASSIGNEES.equals(task.getReviewType())){
            throw new ForbiddenException("Задача должна иметь тип ревью MANUAL_ASSIGNEES");
        }
        if(request.reviewerIds().isEmpty()){
            throw new ForbiddenException("Список ревьюеров пуст");
        }

        for(Review review : task.getReviews()){
            ReviewIteration reviewIteration = review.getLastIteration();
            if(reviewIteration == null || reviewIteration.getDeadline() == null){
                throw new ForbiddenException("Некорректные данные ревью");
            }
            if(reviewIteration.getReviewVerdict() != null){
                throw new ForbiddenException("Найдено итоговое ревью на задачу, ручная отправка невозможна");
            }
            if(!reviewIteration.getDeadline().isBefore(LocalDateTime.now())){
                throw new ForbiddenException("Дедлайн по ревью ещё не истёк");
            }
        }

        List<User> reviewers = new ArrayList<>();
        for(Long reviewerId : request.reviewerIds()){
            reviewers.add(userService.getById(reviewerId));
        }

        List<Review> reviews = reviewService.create(reviewers, solution);

        return ResponseEntity.status(201).body(
                solutionMapper.mapToSolutionSubmitResponse(solution, ReviewStatus.NEW,
                        reviews.get(0).getLastIteration().getDeadline().toString()));
    }
}

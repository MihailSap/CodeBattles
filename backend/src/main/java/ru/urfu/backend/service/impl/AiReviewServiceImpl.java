package ru.urfu.backend.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.context.ApplicationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestClient;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.*;
import ru.urfu.backend.repository.AiReviewEvaluationRepository;
import ru.urfu.backend.repository.AiSolutionEvaluationRepository;
import ru.urfu.backend.repository.CommentRepository;
import ru.urfu.backend.repository.ReviewIterationRepository;
import ru.urfu.backend.repository.ReviewRepository;
import ru.urfu.backend.repository.ReviewVerdictRepository;
import ru.urfu.backend.service.AiReviewService;
import ru.urfu.backend.service.NotificationService;
import ru.urfu.backend.service.SystemSettingsService;
import ru.urfu.backend.service.TaskService;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AiReviewServiceImpl implements AiReviewService {

    private static final int MAX_FILES_FOR_PROMPT = 20;
    private static final int MAX_FILE_CHARS = 12000;
    private static final int MAX_TOTAL_CHARS = 60000;
    private static final int MAX_AI_RESPONSE_ATTEMPTS = 2;

    private final AiSolutionEvaluationRepository aiSolutionEvaluationRepository;
    private final AiReviewEvaluationRepository aiReviewEvaluationRepository;
    private final CommentRepository commentRepository;
    private final ReviewIterationRepository reviewIterationRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewVerdictRepository reviewVerdictRepository;
    private final SystemSettingsService systemSettingsService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final ApplicationContext applicationContext;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String siteUrl;
    private final String siteName;

    public AiReviewServiceImpl(
            AiSolutionEvaluationRepository aiSolutionEvaluationRepository,
            AiReviewEvaluationRepository aiReviewEvaluationRepository,
            CommentRepository commentRepository,
            ReviewIterationRepository reviewIterationRepository,
            ReviewRepository reviewRepository,
            ReviewVerdictRepository reviewVerdictRepository,
            SystemSettingsService systemSettingsService,
            TaskService taskService,
            NotificationService notificationService,
            ObjectMapper objectMapper,
            ApplicationContext applicationContext,
            RestClient.Builder restClientBuilder,
            @Value("${ai.provider:openrouter}") String provider,
            @Value("${ai.openrouter.api-key:}") String apiKey,
            @Value("${ai.openrouter.model:}") String model,
            @Value("${ai.openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            @Value("${ai.openrouter.site-url:}") String siteUrl,
            @Value("${ai.openrouter.site-name:CodeBattles}") String siteName
    ) {
        this.aiSolutionEvaluationRepository = aiSolutionEvaluationRepository;
        this.aiReviewEvaluationRepository = aiReviewEvaluationRepository;
        this.commentRepository = commentRepository;
        this.reviewIterationRepository = reviewIterationRepository;
        this.reviewRepository = reviewRepository;
        this.reviewVerdictRepository = reviewVerdictRepository;
        this.systemSettingsService = systemSettingsService;
        this.taskService = taskService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
        this.applicationContext = applicationContext;
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.provider = provider;
        this.apiKey = apiKey;
        this.model = model;
        this.siteUrl = siteUrl;
        this.siteName = siteName;
    }

    @Override
    public void analyzeSolution(ReviewIteration reviewIteration) {
        if (reviewIteration == null || reviewIteration.getId() == null) {
            return;
        }
        scheduleAfterCommit(() -> applicationContext
                .getBean(AiReviewServiceImpl.class)
                .analyzeSolutionAsync(reviewIteration.getId()));
    }

    @Async
    @Transactional
    public void analyzeSolutionAsync(Long reviewIterationId) {
        ReviewIteration reviewIteration = reviewIterationRepository.findById(reviewIterationId).orElse(null);
        if (reviewIteration == null) {
            return;
        }
        analyzeSolutionNow(reviewIteration);
    }

    private void analyzeSolutionNow(ReviewIteration reviewIteration) {
        if (!isEnabled(reviewIteration)) {
            return;
        }

        AiSolutionEvaluation evaluation = aiSolutionEvaluationRepository
                .findByReviewIteration(reviewIteration)
                .orElseGet(() -> createSolutionEvaluation(reviewIteration));

        try {
            AiSolutionResult result = requestSolutionReview(reviewIteration);
            evaluation.setStatus(AiEvaluationStatus.COMPLETED);
            evaluation.setQualityScore(score(result.qualityScore()));
            evaluation.setCyclomaticComplexity(blankToDefault(result.cyclomaticComplexity(), "Не определено"));
            evaluation.setSolidViolationsCount(nonNegative(result.solidViolationsCount()));
            evaluation.setSolidViolationsSeverity(blankToDefault(result.solidViolationsSeverity(), "Проблем нет"));
            evaluation.setOverallComment(blankToDefault(result.overallComment(), "AI не оставила общий комментарий."));
            evaluation.setErrorMessage(null);
            evaluation.setUpdatedAt(LocalDateTime.now());
            aiSolutionEvaluationRepository.save(evaluation);
            saveAiComments(reviewIteration, result.comments());
            completeAiOnlyReview(reviewIteration, evaluation);
        } catch (Exception exception) {
            markSolutionEvaluationFailed(evaluation, exception);
        }
    }

    @Override
    public void evaluateReview(Review review) {
        if (review == null || review.getId() == null) {
            return;
        }
        scheduleAfterCommit(() -> applicationContext
                .getBean(AiReviewServiceImpl.class)
                .evaluateReviewAsync(review.getId()));
    }

    @Async
    @Transactional
    public void evaluateReviewAsync(Long reviewId) {
        Review review = reviewRepository.findById(reviewId).orElse(null);
        if (review == null) {
            return;
        }
        evaluateReviewNow(review);
    }

    private void evaluateReviewNow(Review review) {
        ReviewIteration reviewIteration = review.getLastIteration();
        if (reviewIteration == null || !isEnabled(reviewIteration) || reviewIteration.getReviewVerdict() == null) {
            return;
        }

        AiReviewEvaluation evaluation = aiReviewEvaluationRepository
                .findByReviewIteration(reviewIteration)
                .orElseGet(() -> createReviewEvaluation(reviewIteration));

        try {
            AiHumanReviewResult result = requestHumanReviewEvaluation(review);
            evaluation.setStatus(AiEvaluationStatus.COMPLETED);
            evaluation.setQualityScore(score(result.qualityScore()));
            evaluation.setSpecificity(score(result.specificity()));
            evaluation.setTechDepth(score(result.techDepth()));
            evaluation.setCorrectness(score(result.correctness()));
            evaluation.setNonToxicity(score(result.nonToxicity()));
            evaluation.setSummary(blankToDefault(result.summary(), "AI не оставила комментарий по качеству ревью."));
            evaluation.setErrorMessage(null);
            evaluation.setUpdatedAt(LocalDateTime.now());
            aiReviewEvaluationRepository.save(evaluation);
            notificationService.notifyAiReviewCompleted(review.getTask());
        } catch (Exception exception) {
            markReviewEvaluationFailed(evaluation, exception);
        }
    }

    private void scheduleAfterCommit(Runnable runnable) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            runnable.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                runnable.run();
            }
        });
    }

    private boolean isEnabled(ReviewIteration reviewIteration) {
        Task task = reviewIteration.getReview().getTask();
        return "openrouter".equalsIgnoreCase(provider)
                && Boolean.TRUE.equals(task.getAiReviewEnabledAtCreation())
                && apiKey != null
                && !apiKey.isBlank()
                && model != null
                && !model.isBlank();
    }

    private AiSolutionEvaluation createSolutionEvaluation(ReviewIteration reviewIteration) {
        AiSolutionEvaluation evaluation = new AiSolutionEvaluation();
        evaluation.setReviewIteration(reviewIteration);
        evaluation.setStatus(AiEvaluationStatus.PENDING);
        evaluation.setCreatedAt(LocalDateTime.now());
        evaluation.setUpdatedAt(LocalDateTime.now());
        return aiSolutionEvaluationRepository.save(evaluation);
    }

    private AiReviewEvaluation createReviewEvaluation(ReviewIteration reviewIteration) {
        AiReviewEvaluation evaluation = new AiReviewEvaluation();
        evaluation.setReviewIteration(reviewIteration);
        evaluation.setStatus(AiEvaluationStatus.PENDING);
        evaluation.setCreatedAt(LocalDateTime.now());
        evaluation.setUpdatedAt(LocalDateTime.now());
        return aiReviewEvaluationRepository.save(evaluation);
    }

    private AiSolutionResult requestSolutionReview(ReviewIteration reviewIteration) throws Exception {
        return requestAiJson(buildSolutionPrompt(reviewIteration), AiSolutionResult.class);
    }

    private AiHumanReviewResult requestHumanReviewEvaluation(Review review) throws Exception {
        return requestAiJson(buildHumanReviewPrompt(review), AiHumanReviewResult.class);
    }

    private <T> T requestAiJson(String prompt, Class<T> resultType) throws Exception {
        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_AI_RESPONSE_ATTEMPTS; attempt++) {
            try {
                String content = callOpenRouter(prompt);
                return objectMapper.readValue(extractJson(content), resultType);
            } catch (Exception exception) {
                lastException = exception;
                if (attempt >= MAX_AI_RESPONSE_ATTEMPTS || !isRetryableAiResponseException(exception)) {
                    throw exception;
                }
            }
        }
        throw lastException == null
                ? new IllegalStateException("AI не вернула корректный ответ.")
                : lastException;
    }

    private String callOpenRouter(String prompt) {
        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("Authorization", "Bearer " + apiKey);
        if (siteUrl != null && !siteUrl.isBlank()) {
            headers.put("HTTP-Referer", siteUrl);
        }
        if (siteName != null && !siteName.isBlank()) {
            headers.put("X-OpenRouter-Title", siteName);
        }

        OpenRouterRequest request = new OpenRouterRequest(
                model,
                List.of(
                        new OpenRouterMessage(
                                "system",
                                systemPrompt() + "\n\nОтвечай только валидным JSON без markdown."
                        ),
                        new OpenRouterMessage("user", prompt)
                ),
                new OpenRouterResponseFormat("json_object")
        );

        RestClient.RequestBodySpec spec = restClient
                .post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON);
        for (Map.Entry<String, String> header : headers.entrySet()) {
            spec = spec.header(header.getKey(), header.getValue());
        }

        OpenRouterResponse response = spec
                .body(request)
                .retrieve()
                .body(OpenRouterResponse.class);

        if (response == null) {
            throw new IllegalStateException("OpenRouter вернул пустой ответ. Попробуйте повторить проверку позже.");
        }
        if (response.error() != null && response.error().message() != null && !response.error().message().isBlank()) {
            throw new IllegalStateException("OpenRouter вернул ошибку: " + response.error().message());
        }
        if (response.choices() == null || response.choices().isEmpty()) {
            throw new IllegalStateException("OpenRouter не вернул вариантов ответа. Провайдер мог временно не сгенерировать оценку.");
        }
        OpenRouterChoice choice = response.choices().get(0);
        if (choice.message() == null || choice.message().content() == null || choice.message().content().isBlank()) {
            String reason = choice.finishReason() == null || choice.finishReason().isBlank()
                    ? ""
                    : " Причина завершения: " + choice.finishReason() + ".";
            throw new IllegalStateException("OpenRouter вернул пустое сообщение." + reason);
        }
        return choice.message().content();
    }

    private String buildSolutionPrompt(ReviewIteration reviewIteration) {
        Task task = reviewIteration.getReview().getTask();
        StringBuilder prompt = new StringBuilder();
        prompt.append("Проанализируй решение задачи и верни JSON строго такой формы:\n");
        prompt.append("""
                {
                  "qualityScore": 1,
                  "cyclomaticComplexity": "низкая|средняя|высокая|не определено",
                  "solidViolationsCount": 0,
                  "solidViolationsSeverity": "Проблем нет|Не критично|Средняя|Высокая",
                  "overallComment": "краткое резюме",
                  "comments": [
                    {
                      "file": "path/from/input",
                      "startLine": 1,
                      "endLine": 1,
                      "text": "конкретный inline-комментарий",
                      "category": "BUG",
                      "severity": "HIGH"
                    }
                  ]
                }
                """);
        prompt.append("Оценки ставь от 1 до 5. Не придумывай файлы и строки вне входных данных. ");
        prompt.append("JSON должен содержать не больше 8 inline comments.\n\n");
        prompt.append("Задача: ").append(task.getTitle()).append("\n");
        prompt.append("Описание: ").append(nullToEmpty(task.getDescription())).append("\n");
        prompt.append("Критерии: ").append(nullToEmpty(task.getEvaluationCriteria())).append("\n");
        prompt.append("Требования: ").append(nullToEmpty(task.getRequirements())).append("\n\n");
        prompt.append("Файлы решения:\n");
        prompt.append(buildFilesBlock(reviewIteration.getReviewFileContents()));
        return prompt.toString();
    }

    private String buildHumanReviewPrompt(Review review) {
        ReviewIteration reviewIteration = review.getLastIteration();
        ReviewVerdict verdict = reviewIteration.getReviewVerdict();
        StringBuilder prompt = new StringBuilder();
        prompt.append("Оцени качество человеческого code review и верни JSON строго такой формы:\n");
        prompt.append("""
                {
                  "qualityScore": 1,
                  "specificity": 1,
                  "techDepth": 1,
                  "correctness": 1,
                  "nonToxicity": 1,
                  "summary": "краткое резюме"
                }
                """);
        prompt.append("Все оценки от 1 до 5. Учитывай конкретность, техническую глубину, корректность и нетоксичность.\n\n");
        prompt.append("Итоговое ревью:\n");
        prompt.append("Architecture: ").append(verdict.getArchitecture()).append("\n");
        prompt.append("Readability: ").append(verdict.getReadability()).append("\n");
        prompt.append("Testability: ").append(verdict.getTestability()).append("\n");
        prompt.append("Scalability: ").append(verdict.getScalability()).append("\n");
        prompt.append("Verdict: ").append(verdict.getVerdict()).append("\n");
        prompt.append("Comment: ").append(nullToEmpty(verdict.getComment())).append("\n\n");
        prompt.append("Inline-комментарии ревьюера:\n");
        reviewIteration.getComments().stream()
                .filter(comment -> CommentAuthorRole.REVIEWER.equals(comment.getCommentAuthorRole()))
                .filter(comment -> comment.getParentComment() == null)
                .forEach(comment -> prompt
                        .append("- ")
                        .append(nullToEmpty(comment.getFile()))
                        .append(":")
                        .append(comment.getStartLine())
                        .append("-")
                        .append(comment.getEndLine())
                        .append(" ")
                        .append(nullToEmpty(comment.getText()))
                        .append("\n"));
        prompt.append("\nФайлы решения для проверки корректности замечаний:\n");
        prompt.append(buildFilesBlock(reviewIteration.getReviewFileContents()));
        return prompt.toString();
    }

    private String buildFilesBlock(Set<ReviewFileContent> files) {
        StringBuilder block = new StringBuilder();
        int totalChars = 0;
        int filesAdded = 0;
        List<ReviewFileContent> sortedFiles = files.stream()
                .sorted(Comparator.comparing(ReviewFileContent::getPath, Comparator.nullsLast(String::compareTo)))
                .toList();
        for (ReviewFileContent file : sortedFiles) {
            if (filesAdded >= MAX_FILES_FOR_PROMPT || totalChars >= MAX_TOTAL_CHARS) {
                break;
            }
            String content = nullToEmpty(file.getContent());
            String clipped = content.length() > MAX_FILE_CHARS ? content.substring(0, MAX_FILE_CHARS) : content;
            totalChars += clipped.length();
            filesAdded++;
            block.append("FILE: ").append(file.getPath()).append("\n");
            block.append("LANGUAGE: ").append(nullToEmpty(file.getLanguage())).append("\n");
            block.append("CONTENT:\n```").append(nullToEmpty(file.getLanguage())).append("\n");
            block.append(clipped).append("\n```\n\n");
        }
        return block.toString();
    }

    private void saveAiComments(ReviewIteration reviewIteration, List<AiInlineCommentResult> comments) {
        if (comments == null || comments.isEmpty()) {
            return;
        }
        Map<String, Integer> fileLineCounts = new HashMap<>();
        for (ReviewFileContent file : reviewIteration.getReviewFileContents()) {
            fileLineCounts.put(file.getPath(), countLines(file.getContent()));
        }

        comments.stream()
                .limit(8)
                .filter(comment -> comment.file() != null && fileLineCounts.containsKey(comment.file()))
                .forEach(comment -> saveAiComment(reviewIteration, comment, fileLineCounts.get(comment.file())));
    }

    private void saveAiComment(ReviewIteration reviewIteration, AiInlineCommentResult result, Integer fileLineCount) {
        int startLine = clamp(result.startLine(), 1, Math.max(fileLineCount, 1));
        int endLine = clamp(result.endLine(), startLine, Math.max(fileLineCount, startLine));
        Comment comment = new Comment();
        comment.setReviewIteration(reviewIteration);
        comment.setCommentAuthorRole(CommentAuthorRole.AI);
        comment.setRevealName(true);
        comment.setFile(result.file());
        comment.setStartLine(startLine);
        comment.setEndLine(endLine);
        comment.setText(blankToDefault(result.text(), "AI заметила потенциальную проблему в этом месте."));
        comment.setCategory(parseCategory(result.category()));
        comment.setSeverity(parseSeverity(result.severity()));
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }

    private void completeAiOnlyReview(ReviewIteration reviewIteration, AiSolutionEvaluation evaluation) {
        Review review = reviewIteration.getReview();
        Task task = review.getTask();
        if (!ReviewType.AI_ONLY.equals(task.getReviewType()) || reviewIteration.getReviewVerdict() != null) {
            return;
        }

        int qualityScore = score(evaluation.getQualityScore());
        ReviewVerdict reviewVerdict = new ReviewVerdict();
        reviewVerdict.setReviewIteration(reviewIteration);
        reviewVerdict.setArchitecture(qualityScore);
        reviewVerdict.setReadability(qualityScore);
        reviewVerdict.setTestability(qualityScore);
        reviewVerdict.setScalability(qualityScore);
        reviewVerdict.setOverallScore(qualityScore);
        reviewVerdict.setComment(evaluation.getOverallComment());
        reviewVerdict.setVerdict(qualityScore >= 4 ? ReviewVerdictType.APPROVED : ReviewVerdictType.REWORK);
        reviewIteration.setReviewVerdict(reviewVerdict);
        reviewIteration.setCompletedAt(LocalDateTime.now());
        reviewVerdictRepository.save(reviewVerdict);

        review.setStatus(ReviewStatus.COMPLETED);
        reviewRepository.save(review);

        if (ReviewVerdictType.APPROVED.equals(reviewVerdict.getVerdict())) {
            taskService.updateStatusDone(task);
            notificationService.notifyTaskCompleted(task);
        } else {
            taskService.updateStatusRework(task);
        }
    }

    private ReviewCommentCategory parseCategory(String category) {
        if (category == null || category.isBlank()) {
            return ReviewCommentCategory.OTHER;
        }
        try {
            return ReviewCommentCategory.valueOf(category.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return ReviewCommentCategory.OTHER;
        }
    }

    private ReviewCommentSeverity parseSeverity(String severity) {
        if (severity == null || severity.isBlank()) {
            return ReviewCommentSeverity.LOW;
        }
        try {
            return ReviewCommentSeverity.valueOf(severity.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return ReviewCommentSeverity.LOW;
        }
    }

    private void markSolutionEvaluationFailed(AiSolutionEvaluation evaluation, Exception exception) {
        evaluation.setStatus(AiEvaluationStatus.FAILED);
        evaluation.setErrorMessage(shortError(exception));
        evaluation.setUpdatedAt(LocalDateTime.now());
        aiSolutionEvaluationRepository.save(evaluation);
    }

    private void markReviewEvaluationFailed(AiReviewEvaluation evaluation, Exception exception) {
        evaluation.setStatus(AiEvaluationStatus.FAILED);
        evaluation.setErrorMessage(shortError(exception));
        evaluation.setUpdatedAt(LocalDateTime.now());
        aiReviewEvaluationRepository.save(evaluation);
    }

    private String extractJson(String content) throws Exception {
        String trimmed = content.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed;
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            String json = trimmed.substring(start, end + 1);
            JsonNode ignored = objectMapper.readTree(json);
            return json;
        }
        throw new IllegalArgumentException("Ответ AI не содержит JSON-объект");
    }

    private String systemPrompt() {
        SystemSettings settings = systemSettingsService.getSystemSettings();
        String prompt = settings.getAiSystemPrompt();
        if (prompt == null || prompt.isBlank()) {
            return "Проверяй код строго, но конструктивно. Комментарии должны быть конкретными и полезными.";
        }
        return prompt;
    }

    private int score(Integer value) {
        return clamp(value, 1, 5);
    }

    private int nonNegative(Integer value) {
        return Math.max(value == null ? 0 : value, 0);
    }

    private int clamp(Integer value, int min, int max) {
        int safeValue = value == null ? min : value;
        return Math.max(min, Math.min(max, safeValue));
    }

    private int countLines(String content) {
        if (content == null || content.isEmpty()) {
            return 1;
        }
        return content.split("\\R", -1).length;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String shortError(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return exception.getClass().getSimpleName();
        }
        message = localizeAiError(message);
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }

    private boolean isRetryableAiResponseException(Exception exception) {
        if (exception instanceof JsonProcessingException) {
            return true;
        }
        String message = exception.getMessage();
        if (message == null) {
            return false;
        }
        return message.contains("пустой ответ")
                || message.contains("не вернул вариантов ответа")
                || message.contains("пустое сообщение")
                || message.contains("не содержит JSON")
                || message.contains("Unexpected character")
                || message.contains("was expecting");
    }

    private String localizeAiError(String message) {
        if (message.contains("OpenRouter returned an empty response")) {
            return "OpenRouter не вернул вариантов ответа. Провайдер мог временно не сгенерировать оценку.";
        }
        if (message.contains("OpenRouter returned an empty message")) {
            return "OpenRouter вернул пустое сообщение. Попробуйте повторить проверку позже.";
        }
        if (message.contains("AI response does not contain a JSON object")) {
            return "Ответ AI не содержит JSON-объект.";
        }
        return message;
    }

    private record OpenRouterRequest(
            String model,
            List<OpenRouterMessage> messages,
            @JsonProperty("response_format")
            OpenRouterResponseFormat responseFormat
    ) {}

    private record OpenRouterMessage(String role, String content) {}

    private record OpenRouterResponseFormat(String type) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenRouterResponse(List<OpenRouterChoice> choices, OpenRouterError error) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenRouterChoice(
            OpenRouterMessageResponse message,
            @JsonProperty("finish_reason")
            String finishReason
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenRouterMessageResponse(String content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenRouterError(String message, Integer code) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AiSolutionResult(
            Integer qualityScore,
            String cyclomaticComplexity,
            Integer solidViolationsCount,
            String solidViolationsSeverity,
            String overallComment,
            List<AiInlineCommentResult> comments
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AiInlineCommentResult(
            String file,
            Integer startLine,
            Integer endLine,
            String text,
            String category,
            String severity
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AiHumanReviewResult(
            Integer qualityScore,
            Integer specificity,
            Integer techDepth,
            Integer correctness,
            Integer nonToxicity,
            String summary
    ) {}
}

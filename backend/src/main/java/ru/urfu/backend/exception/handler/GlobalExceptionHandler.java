package ru.urfu.backend.exception.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import ru.urfu.backend.dto.ErrorResponse;
import ru.urfu.backend.exception.customEx.*;
import ru.urfu.backend.exception.globalEx.*;
import ru.urfu.backend.utils.ExceptionUtils;

@ControllerAdvice
public class GlobalExceptionHandler {

    private final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(InvalidException.class)
    public ResponseEntity<ErrorResponse> handleInvalidException(InvalidException ex) {
        logger.error("InvalidException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("status", 1, "message", "path");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundEx(NotFoundException ex) {
        logger.error("NotFoundException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("status", 1, "message", "path");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleConflictEx(AlreadyExistsException ex) {
        logger.error("AlreadyExistsException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("status", 1, "message", "path");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(AccountNotEnabledException.class)
    public ResponseEntity<ErrorResponse> handleConflictEx(AccountNotEnabledException ex) {
        logger.error("AccountNotEnabledException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("status", 1, "message", "path");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(NotEnoughReviewersException.class)
    public ResponseEntity<ErrorResponse> handleConflictEx(NotEnoughReviewersException ex) {
        logger.error("NotEnoughReviewersException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("CONFLICT", 409, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        logger.error("Exception: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("status", 1, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleException(RuntimeException ex) {
        logger.error("Exception: {}", ex.getMessage(), ex);

        String message = ex.getMessage();
        ErrorResponse response = ExceptionUtils.create("status", 500, message, "path");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ForbiddenException ex) {
        logger.error("ForbiddenException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("FORBIDDEN", 403, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(ru.urfu.backend.exception.customEx.EmailSendTimeoutException.class)
    public ResponseEntity<ErrorResponse> handleEmailSendTimeout(ru.urfu.backend.exception.customEx.EmailSendTimeoutException ex) {
        logger.error("EmailSendTimeoutException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("EMAIL_SEND_TIMEOUT", 504, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT).body(response);
    }

    @ExceptionHandler(MaxDepthExceedException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(MaxDepthExceedException ex) {
        logger.error("ForbiddenException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "MAX_DEPTH_EXCEEDED", 422, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    @ExceptionHandler(ForbiddenOrganizationException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ForbiddenOrganizationException ex) {
        logger.error("ForbiddenException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "FORBIDDEN_ORGANIZATION", 403, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    @ExceptionHandler(AlreadyMemberException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(AlreadyMemberException ex) {
        logger.error("AlreadyMemberException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "ALREADY_MEMBER", 409, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(AccessRequestAlreadyExists.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(AccessRequestAlreadyExists ex) {
        logger.error("AccessRequestAlreadyExists: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "ORGANIZATION_ACCESS_REQUEST_ALREADY_EXISTS", 409, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(AdminCannotLeaveException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(AdminCannotLeaveException ex) {
        logger.error("AdminCannotLeaveException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "ADMIN_CANNOT_LEAVE", 400, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(OrganizationRequestNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(OrganizationRequestNotFoundException ex) {
        logger.error("OrganizationRequestNotFoundException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "ORGANIZATION_JOIN_REQUEST_NOT_FOUND", 404, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(InvalidInviteException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(InvalidInviteException ex) {
        logger.error("InvalidInviteException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "INVALID_INVITE", 400, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(OrganizationNameConflictException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(OrganizationNameConflictException ex) {
        logger.error("OrganizationNameConflictException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "ORGANIZATION_NAME_CONFLICT", 409, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(InvalidCurrentPasswordException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(InvalidCurrentPasswordException ex) {
        logger.error("InvalidCurrentPasswordException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "INVALID_CURRENT_PASSWORD", 409, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(ProjectNameConflictException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ProjectNameConflictException ex) {
        logger.error("ProjectNameConflictException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "PROJECT_NAME_CONFLICT", 409, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(ForbiddenProjectException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ForbiddenProjectException ex) {
        logger.error("ForbiddenProjectException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "FORBIDDEN_PROJECT", 403, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(OwnerCannotLeaveProjectException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(OwnerCannotLeaveProjectException ex) {
        logger.error("OwnerCannotLeaveProjectException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "400 OWNER CAN'T LEAVE PROJECT", 400, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ProjectNotPublicException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ProjectNotPublicException ex) {
        logger.error("ProjectNotPublicException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "PROJECT_NOT_PUBLIC", 403, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(ForbiddenReviewException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ForbiddenReviewException ex) {
        logger.error("ForbiddenReviewException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "FORBIDDEN_REVIEW", 403, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(ForbiddenTaskException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ForbiddenTaskException ex) {
        logger.error("ForbiddenTaskException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "FORBIDDEN_TASK", 403, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(CommentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(CommentNotFoundException ex) {
        logger.error("CommentNotFoundException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "COMMENT_NOT_FOUND", 404, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(ReportNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenEx(ReportNotFoundException ex) {
        logger.error("ReportNotFoundException: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create(
                "REPORT_NOT_FOUND", 404, ex.getMessage(), "path");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
}

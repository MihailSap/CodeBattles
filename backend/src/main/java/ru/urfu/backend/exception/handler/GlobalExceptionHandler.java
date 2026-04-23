package ru.urfu.backend.exception.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import ru.urfu.backend.dto.ErrorResponse;
import ru.urfu.backend.exception.customEx.AccountNotEnabledException;
import ru.urfu.backend.exception.globalEx.AlreadyExistsException;
import ru.urfu.backend.exception.globalEx.InvalidException;
import ru.urfu.backend.exception.globalEx.NotFoundException;
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        logger.error("Exception: {}", ex.getMessage(), ex);
        ErrorResponse response = ExceptionUtils.create("status", 1, "message", "path");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

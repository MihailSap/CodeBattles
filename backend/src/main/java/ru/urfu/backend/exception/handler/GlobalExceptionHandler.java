package ru.urfu.backend.exception.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import ru.urfu.backend.dto.ErrorResponse;
import ru.urfu.backend.exception.globalEx.AlreadyExistsException;
import ru.urfu.backend.exception.globalEx.InvalidException;
import ru.urfu.backend.exception.globalEx.NotFoundException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(InvalidException.class)
    public ResponseEntity<ErrorResponse> handleInvalidException(InvalidException ex) {
        logger.error("InvalidException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundEx(NotFoundException ex) {
        logger.error("NotFoundException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleConflictEx(AlreadyExistsException ex) {
        logger.error("AlreadyExistsException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        logger.error("Exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(ex.getMessage()));
    }
}

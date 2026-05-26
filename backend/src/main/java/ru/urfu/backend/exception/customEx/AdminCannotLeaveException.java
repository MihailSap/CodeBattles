package ru.urfu.backend.exception.customEx;

public class AdminCannotLeaveException extends RuntimeException {
    public AdminCannotLeaveException(String message) {
        super(message);
    }
}

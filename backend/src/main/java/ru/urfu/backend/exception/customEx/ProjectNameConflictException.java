package ru.urfu.backend.exception.customEx;

public class ProjectNameConflictException extends RuntimeException {
    public ProjectNameConflictException(String message) {
        super(message);
    }
}

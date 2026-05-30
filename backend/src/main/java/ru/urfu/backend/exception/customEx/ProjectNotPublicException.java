package ru.urfu.backend.exception.customEx;

public class ProjectNotPublicException extends RuntimeException{
    public ProjectNotPublicException(String message) {
        super(message);
    }
}

package ru.urfu.backend.exception.customEx;

public class OrganizationNameConflictException extends RuntimeException {
    public OrganizationNameConflictException(String message) {
        super(message);
    }
}

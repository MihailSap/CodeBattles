package ru.urfu.backend.exception.customEx;

public class OrganizationRequestNotFoundException extends RuntimeException {
    public OrganizationRequestNotFoundException(String message) {
        super(message);
    }
}

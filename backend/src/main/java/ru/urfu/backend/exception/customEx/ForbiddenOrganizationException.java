package ru.urfu.backend.exception.customEx;

public class ForbiddenOrganizationException extends RuntimeException{
    public ForbiddenOrganizationException(String message){
        super(message);
    }
}

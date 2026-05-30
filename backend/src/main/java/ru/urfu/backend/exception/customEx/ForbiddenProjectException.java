package ru.urfu.backend.exception.customEx;

public class ForbiddenProjectException extends RuntimeException{
    public ForbiddenProjectException(String message){
        super(message);
    }
}

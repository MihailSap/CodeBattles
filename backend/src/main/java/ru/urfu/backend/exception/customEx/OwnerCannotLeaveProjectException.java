package ru.urfu.backend.exception.customEx;

public class OwnerCannotLeaveProjectException extends RuntimeException{
    public OwnerCannotLeaveProjectException(String message){
        super(message);
    }
}

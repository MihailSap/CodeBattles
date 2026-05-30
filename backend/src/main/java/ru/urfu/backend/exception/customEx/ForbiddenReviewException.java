package ru.urfu.backend.exception.customEx;

public class ForbiddenReviewException extends RuntimeException{
    public ForbiddenReviewException(String message){
        super(message);
    }
}

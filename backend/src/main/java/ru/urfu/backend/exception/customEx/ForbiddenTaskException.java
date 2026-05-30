package ru.urfu.backend.exception.customEx;

public class ForbiddenTaskException extends RuntimeException{
    public ForbiddenTaskException(String message){
        super(message);
    }
}

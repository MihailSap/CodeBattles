package ru.urfu.backend.exception.customEx;

public class AlreadyMemberException extends RuntimeException{
    public AlreadyMemberException(String message){
        super(message);
    }
}

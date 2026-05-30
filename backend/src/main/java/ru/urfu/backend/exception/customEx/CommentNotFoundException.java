package ru.urfu.backend.exception.customEx;

public class CommentNotFoundException extends RuntimeException{
    public CommentNotFoundException(String message){
        super(message);
    }
}

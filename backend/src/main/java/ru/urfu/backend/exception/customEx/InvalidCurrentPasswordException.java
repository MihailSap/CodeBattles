package ru.urfu.backend.exception.customEx;

public class InvalidCurrentPasswordException extends RuntimeException{
    public InvalidCurrentPasswordException(String message) {
        super(message);
    }
}

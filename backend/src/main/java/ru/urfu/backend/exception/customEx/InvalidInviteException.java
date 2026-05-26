package ru.urfu.backend.exception.customEx;

public class InvalidInviteException extends RuntimeException{
    public InvalidInviteException(String message) {
        super(message);
    }
}

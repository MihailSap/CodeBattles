package ru.urfu.backend.exception.customEx;

public class EmailSendTimeoutException extends RuntimeException {
    public EmailSendTimeoutException(String message) {
        super(message);
    }
}

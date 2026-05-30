package ru.urfu.backend.exception.customEx;

public class NotEnoughReviewersException extends RuntimeException {
    public NotEnoughReviewersException(String message) {
        super(message);
    }
}

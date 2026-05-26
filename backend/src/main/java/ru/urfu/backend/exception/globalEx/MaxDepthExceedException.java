package ru.urfu.backend.exception.globalEx;

public class MaxDepthExceedException extends RuntimeException {
    public MaxDepthExceedException(String message) {
        super(message);
    }
}

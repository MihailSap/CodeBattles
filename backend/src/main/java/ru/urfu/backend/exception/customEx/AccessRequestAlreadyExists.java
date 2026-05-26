package ru.urfu.backend.exception.customEx;

public class AccessRequestAlreadyExists extends RuntimeException{
    public AccessRequestAlreadyExists(String message) {
        super(message);
    }
}

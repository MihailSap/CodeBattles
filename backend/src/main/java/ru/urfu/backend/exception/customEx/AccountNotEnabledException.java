package ru.urfu.backend.exception.customEx;

public class AccountNotEnabledException extends Exception {
    public AccountNotEnabledException(String message) {
        super(message);
    }
}

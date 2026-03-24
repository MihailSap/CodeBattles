package ru.urfu.backend.exception.customEx;

import ru.urfu.backend.exception.globalEx.InvalidException;

public class InvalidCredentialsException extends InvalidException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}

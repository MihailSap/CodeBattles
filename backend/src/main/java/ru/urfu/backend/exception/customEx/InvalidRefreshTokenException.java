package ru.urfu.backend.exception.customEx;

import ru.urfu.backend.exception.globalEx.InvalidException;

public class InvalidRefreshTokenException extends InvalidException {
    public InvalidRefreshTokenException(String message) {
        super(message);
    }
}

package ru.urfu.backend.exception.customEx;

import ru.urfu.backend.exception.globalEx.AlreadyExistsException;

public class UserAlreadyExistsException extends AlreadyExistsException {
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}

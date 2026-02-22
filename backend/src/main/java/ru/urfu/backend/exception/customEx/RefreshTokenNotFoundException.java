package ru.urfu.backend.exception.customEx;

import ru.urfu.backend.exception.globalEx.NotFoundException;

public class RefreshTokenNotFoundException extends NotFoundException {
    public RefreshTokenNotFoundException(String message) {
        super(message);
    }
}

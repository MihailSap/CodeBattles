package ru.urfu.backend.exception.customEx;

import ru.urfu.backend.exception.globalEx.NotFoundException;

public class UserNotFoundException extends NotFoundException {
    public UserNotFoundException(String message){
        super(message);
    }
}

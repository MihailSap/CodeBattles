package ru.urfu.backend.utils;

import ru.urfu.backend.dto.ErrorResponse;

import java.time.Instant;

public final class ExceptionUtils {

    public static ErrorResponse create(String status, Integer code, String message, String path){
        return new ErrorResponse(
                Instant.now(),
                code,
                status,
                message,
                path
        );
    }
}

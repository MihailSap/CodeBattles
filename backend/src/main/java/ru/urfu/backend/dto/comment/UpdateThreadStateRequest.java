package ru.urfu.backend.dto.comment;

import ru.urfu.backend.model.enums.ThreadAction;

public record UpdateThreadStateRequest(ThreadAction action) {
}


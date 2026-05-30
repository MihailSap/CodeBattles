package ru.urfu.backend.dto.stack;

import ru.urfu.backend.model.enums.StackType;

public record StackRequest(String title, StackType type) {
}

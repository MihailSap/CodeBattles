package ru.urfu.backend.service;

import ru.urfu.backend.model.Stack;
import ru.urfu.backend.model.enums.StackType;

public interface StackService {

    Stack getOrCreate(String title, StackType type);
}

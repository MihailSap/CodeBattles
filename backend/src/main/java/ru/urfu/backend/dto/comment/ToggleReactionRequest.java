package ru.urfu.backend.dto.comment;

import ru.urfu.backend.model.enums.ReactionType;

public record ToggleReactionRequest(
        ReactionType reaction
) {}


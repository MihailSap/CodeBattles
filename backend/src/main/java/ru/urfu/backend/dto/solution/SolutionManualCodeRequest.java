package ru.urfu.backend.dto.solution;

public record SolutionManualCodeRequest(
        String fileName,
        String language,
        String content
) {
}

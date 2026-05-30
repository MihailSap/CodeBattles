package ru.urfu.backend.dto.solution;

public record SolutionArchiveRequest(
        String fileName,
        Long sizeBytes,
        String contentBase64
) {
}

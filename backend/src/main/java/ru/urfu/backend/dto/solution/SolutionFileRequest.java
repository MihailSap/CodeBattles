package ru.urfu.backend.dto.solution;

public record SolutionFileRequest(
        String path,
        String fileName,
        String language,
        Long sizeBytes,
        String contentBase64
) {
}

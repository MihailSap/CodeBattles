package ru.urfu.backend.dto.solution;

import ru.urfu.backend.model.enums.SolutionUploadType;

import java.util.List;

public record SolutionSubmitRequest(
        Long taskId,
        SolutionUploadType uploadType,
        Boolean revealAuthorAfterReview,
        SolutionManualCodeRequest manualCode,
        List<SolutionFileRequest> files,
        SolutionArchiveRequest archive,
        SolutionGitPullRequest git
) {
}


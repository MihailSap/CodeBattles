package ru.urfu.backend.dto.solution;

import java.util.List;

public record ReviewResendRequest(List<Long> reviewerIds) {
}

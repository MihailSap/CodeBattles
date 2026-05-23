package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.dashboard.DashboardProjectFilterItemDto;
import ru.urfu.backend.dto.dashboard.DashboardReviewItemDto;
import ru.urfu.backend.dto.dashboard.DashboardTaskItemDto;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.Review;
import ru.urfu.backend.model.Task;

@Component
public class DashboardMapper {

    public DashboardTaskItemDto mapToDashboardTaskItemDto(Task task){
        return new DashboardTaskItemDto(
                task.getId(),
                task.getProject().getId(),
                task.getProject().getTitle(),
                task.getTitle(),
                task.getStatus(),
                task.getDeadline()
        );
    }

    public DashboardReviewItemDto mapToDashboardReviewItemDto(Review review){
        Task task = review.getTask();
        Project project = task.getProject();
        return new DashboardReviewItemDto(
                review.getId(),
                task.getId(),
                project.getId(),
                project.getTitle(),
                task.getTitle(),
                review.getStatus(),
                review.getLastIteration().getUploadedAt(),
                review.getLastIteration().getDeadline()
        );
    }

    public DashboardProjectFilterItemDto mapToDashboardProjectFilterItemDto(Project project){
        return new DashboardProjectFilterItemDto(
                project.getId(),
                project.getTitle()
        );
    }
}
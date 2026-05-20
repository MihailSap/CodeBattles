package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.review.*;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.UserTaskType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class ReviewMapper {

    public List<ReviewListItemDto> mapToReviewListItemDto(List<Review> reviews) {
        List<ReviewListItemDto> reviewListItemDtos = new ArrayList<>();
        for (Review review : reviews) {
            reviewListItemDtos.add(mapToReviewListItemDto(review));
        }
        return reviewListItemDtos;
    }

    public ReviewListItemDto mapToReviewListItemDto(Review review) {
        Task task = review.getTask();
        Project project = task.getProject();
        Organization organization = project.getOrganization();
        return new ReviewListItemDto(
                review.getId(),
                task.getId(),
                task.getTitle(),
                mapToReviewProjectResponse(project),
                mapToReviewOrganizationResponse(organization),
                review.getUploadedAt().toString(),
                review.getDeadline().toString(),
                review.getStatus(),
                0, //TODO: Доработать, когда появятся комментарии
                isCheckedInTime(review),
                isExpired(review),
                null, //TODO: Доработать, когда появятся комментарии
                review.getCompletedAt() == null ? "" : review.getCompletedAt().toString(),
                getVisibleUntil(review)
        );
    }

    public ReviewDetailsDto mapToReviewDetailsDto(Review review){
        Task task = review.getTask();
        Project project = task.getProject();
        Organization organization = project.getOrganization();
        Solution solution = task.getSolution();
        Set<UserTask> userTasks = task.getUsers();
        return new ReviewDetailsDto(
                review.getId(),
                task.getId(),
                project.getId(),
                mapToReviewProjectResponse(project),
                mapToReviewOrganizationResponse(organization),
                task.getTitle(),
                task.getStatus(),
                review.getStatus(),
                task.getReviewType(),
                solution.getUploadType(),
                review.getUploadedAt() == null ? "" : review.getUploadedAt().toString(),
                review.getDeadline() == null ? "" : review.getDeadline().toString(),
                review.getCompletedAt() == null ? "" : review.getCompletedAt().toString(),
                getVisibleUntil(review),
                review.getRevealAuthorAfterReview(),
                mapToAssignees(userTasks),
                mapToReviewers(userTasks),
                null, //TODO: Доработать
                null, //TODO: Доработать, когда появится работа с файлами
                null, //TODO: Доработать, когда появятся комментарии
                null, //TODO: Доработать, когда появятся комментарии?
                null, //TODO: Доработать, когда появится финальное ревью
                null, //TODO: Доработать, когда появится ИИ ревью
                null, //TODO: Доработать, когда появится ИИ ревью
                null //TODO: Доработать
        );
    }

    public ReviewProjectResponse mapToReviewProjectResponse(Project project) {
        return new ReviewProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getIsPrivate(),
                project.getAiReviewEnabled()
        );
    }

    public ReviewOrganizationResponse mapToReviewOrganizationResponse(Organization organization) {
        if(organization == null) {
            return null;
        }
        return new ReviewOrganizationResponse(
                organization.getId(),
                organization.getTitle()
        );
    }

    public List<ReviewUserResponse> mapToAssignees(Set<UserTask> users){
        List<ReviewUserResponse> reviewUserResponses = new ArrayList<>();
        for(UserTask userTask : users){
            if(UserTaskType.ASSIGNEE.equals(userTask.getUserTaskType())){
                reviewUserResponses.add(mapToReviewUserResponse(userTask.getUser()));
            }
        }
        return reviewUserResponses;
    }

    public List<ReviewUserResponse> mapToReviewers(Set<UserTask> users){
        List<ReviewUserResponse> reviewUserResponses = new ArrayList<>();
        for(UserTask userTask : users){
            if(UserTaskType.REVIEWER.equals(userTask.getUserTaskType())){
                reviewUserResponses.add(mapToReviewUserResponse(userTask.getUser()));
            }
        }
        return reviewUserResponses;
    }

    public ReviewUserResponse mapToReviewUserResponse(User user){
        return new ReviewUserResponse(
                user.getId(),
                user.getLogin(),
                user.getFullName(),
                user.getAvatarFileTitle()
        );
    }

    public Boolean isCheckedInTime(Review review){
        LocalDateTime completedAt = review.getCompletedAt();
        if(completedAt == null){
            return null;
        }
        return completedAt.isBefore(review.getDeadline());
    }

    public Boolean isExpired(Review review){
        LocalDateTime completedAt = review.getCompletedAt();
        LocalDateTime deadline = review.getDeadline();
        LocalDateTime now = LocalDateTime.now();
        return (completedAt == null && now.isAfter(deadline))
                || completedAt.isAfter(deadline);
    }

    public String getVisibleUntil(Review review){
        LocalDateTime completedAt = review.getCompletedAt();
        if(completedAt == null && LocalDateTime.now().isBefore(review.getDeadline())){
            return LocalDateTime.now().plusYears(1).toString();
        }

        return completedAt.plusDays(7).toString();
    }
}

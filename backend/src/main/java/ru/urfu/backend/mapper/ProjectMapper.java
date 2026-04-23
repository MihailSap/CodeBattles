package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.project.ProjectResponse;
import ru.urfu.backend.model.Project;

import java.util.ArrayList;
import java.util.List;

@Component
public class ProjectMapper {

    public List<ProjectResponse> mapToProjectResponses(List<Project> projects) {
        List<ProjectResponse> projectFullResponses = new ArrayList<>();
        for (Project project : projects) {
            projectFullResponses.add(mapToProjectResponse(project));
        }
        return projectFullResponses;
    }

    public ProjectResponse mapToProjectResponse(Project project) {
        return new ProjectResponse(
                project.getTitle(),
                project.getDescription(),
                project.getStack(),
                project.getPrivate()
        );
    }
}

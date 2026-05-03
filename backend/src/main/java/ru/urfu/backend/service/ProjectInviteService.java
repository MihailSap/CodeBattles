package ru.urfu.backend.service;

import ru.urfu.backend.dto.invite.ProjectInviteRequest;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.ProjectInvite;

public interface ProjectInviteService {

    ProjectInvite getByToken(String token);

    ProjectInvite create(ProjectInviteRequest request, Project project);
}

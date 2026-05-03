package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.invite.ProjectInviteRequest;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.ProjectInvite;
import ru.urfu.backend.repository.ProjectInviteRepository;
import ru.urfu.backend.service.ProjectInviteService;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ProjectInviteServiceImpl implements ProjectInviteService {

    private final ProjectInviteRepository projectInviteRepository;

    @Autowired
    public ProjectInviteServiceImpl(ProjectInviteRepository projectInviteRepository) {
        this.projectInviteRepository = projectInviteRepository;
    }

    @Override
    public ProjectInvite getByToken(String token) {
        return projectInviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("400 INVALID_INVITE"));
    }

    @Transactional
    @Override
    public ProjectInvite create(ProjectInviteRequest request, Project project){
        ProjectInvite projectInvite = new ProjectInvite();
        projectInvite.setProject(project);
        projectInvite.setToken(UUID.randomUUID().toString());
        projectInvite.setReusable(request.reusable());
        projectInvite.setExpiresAt(LocalDateTime.parse(request.expiresAt()));
        return projectInviteRepository.save(projectInvite);
    }
}

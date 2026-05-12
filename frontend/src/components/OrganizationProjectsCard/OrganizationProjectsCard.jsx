import { useMemo } from 'react';
import { ORGANIZATION_MEMBER_ROLE } from '../../constants/organization';
import ProjectCard from '../ProjectCard/ProjectCard';
import './OrganizationProjectsCard.css';

const OrganizationProjectsCard = ({ organization, onProjectOpen, onCreateProject }) => {
  const canCreateProject = organization.role === ORGANIZATION_MEMBER_ROLE.OWNER;
  const visibleProjects = useMemo(() => organization.projects.slice(0, 12), [organization.projects]);
  const hiddenProjectsCount = Math.max(0, organization.projects.length - visibleProjects.length);

  return (
    <article className="organization-projects-card">
      <h2 className="organization-projects-card__title">{organization.name}</h2>

      {visibleProjects.length === 0 ? (
        <p className="organization-projects-card__empty">В этой организации пока нет проектов</p>
      ) : (
        <>
          <div className="organization-projects-card__projects">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => onProjectOpen(project.id)} />
            ))}
          </div>
          {hiddenProjectsCount > 0 && <p className="organization-projects-card__hidden-count">+{hiddenProjectsCount}</p>}
        </>
      )}

      {canCreateProject ? (
        <button className="organization-projects-card__create" type="button" onClick={() => onCreateProject(organization.id)}>
          Создать проект
        </button>
      ) : (
        <div className="organization-projects-card__create organization-projects-card__create--stub" aria-hidden="true" />
      )}
    </article>
  );
};

export default OrganizationProjectsCard;

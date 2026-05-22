import { memo, useCallback, useMemo } from 'react';
import { ORGANIZATION_MEMBER_ROLE } from '@/entities/organization';
import { ProjectCard } from '@/entities/project';
import organizationProjectsCardStyles from './OrganizationProjectsCard.module.scss';

const OrganizationProjectsCard = ({ organization, onProjectOpen, onCreateProject }: LegacyValue) => {
  const canCreateProject = organization.role === ORGANIZATION_MEMBER_ROLE.OWNER;
  const visibleProjects = useMemo(() => organization.projects.slice(0, 12), [organization.projects]);
  const hiddenProjectsCount = Math.max(0, organization.projects.length - visibleProjects.length);

  const handleCreateProject = useCallback(() => {
    onCreateProject(organization.id);
  }, [onCreateProject, organization.id]);

  return (
    <article className={organizationProjectsCardStyles.root}>
      <h2 className={organizationProjectsCardStyles.title}>{organization.name}</h2>

      {visibleProjects.length === 0 ? (
        <p className={organizationProjectsCardStyles.isEmpty}>В этой организации пока нет проектов</p>
      ) : (
        <>
          <div className={organizationProjectsCardStyles.projects}>
            {visibleProjects.map((project: LegacyValue) => (
              <ProjectCard key={project.id} project={project} onOpen={onProjectOpen} />
            ))}
          </div>
          {hiddenProjectsCount > 0 && (
            <p className={organizationProjectsCardStyles.hiddenCount}>+{hiddenProjectsCount}</p>
          )}
        </>
      )}

      {canCreateProject ? (
        <button className={organizationProjectsCardStyles.create} type="button" onClick={handleCreateProject}>
          Создать проект
        </button>
      ) : (
        <div
          className={[organizationProjectsCardStyles.create, organizationProjectsCardStyles.isStub].join(' ')}
          aria-hidden="true"
        />
      )}
    </article>
  );
};

export default memo(OrganizationProjectsCard);

import { memo, useCallback } from 'react';
import privateIcon from '@/shared/assets/private-icon.svg';
import { PROJECT_MEMBER_ROLE, PROJECT_MEMBER_ROLE_LABELS, PROJECT_PRIVACY } from '../../model';
import type { EntityId, Project } from '../../model/types';
import projectCardStyles from './ProjectCard.module.scss';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onOpen?: (projectId: EntityId) => void;
}

const getRoleClassName = (role: Project['role']): string => {
  if (role === PROJECT_MEMBER_ROLE.OWNER) return projectCardStyles.isOwner;
  if (role === PROJECT_MEMBER_ROLE.MEMBER) return projectCardStyles.isMember;

  return projectCardStyles.isGuest;
};

const ProjectCard = ({ project, onClick, onOpen }: ProjectCardProps) => {
  const handleClick = useCallback(() => {
    if (onOpen) {
      onOpen(project.id);

      return;
    }

    onClick?.();
  }, [onClick, onOpen, project.id]);

  return (
    <button className={projectCardStyles.root} type="button" onClick={handleClick}>
      <div className={projectCardStyles.titleRow}>
        <h3 className={projectCardStyles.title}>{project.name}</h3>
        {project.privacy === PROJECT_PRIVACY.PRIVATE && (
          <img className={projectCardStyles.privacy} src={privateIcon} alt="Приватный проект" />
        )}
      </div>
      <p className={[projectCardStyles.role, getRoleClassName(project.role)].filter(Boolean).join(' ')}>
        {project.role ? PROJECT_MEMBER_ROLE_LABELS[project.role] : PROJECT_MEMBER_ROLE_LABELS.GUEST}
      </p>
      <p className={projectCardStyles.tasks}>Открытых задач: {project.openTasksCount}</p>
    </button>
  );
};

export default memo(ProjectCard);

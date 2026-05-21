import { memo, useCallback } from 'react';
import { PROJECT_MEMBER_ROLE_LABELS, PROJECT_PRIVACY } from '../../model';
import privateIcon from '@/shared/assets/private-icon.svg';
import projectCardStyles from './ProjectCard.module.scss';

const roleClassMap = {
  OWNER: projectCardStyles.isOwner,
  MEMBER: projectCardStyles.isMember,
  GUEST: projectCardStyles.isGuest,
};

const ProjectCard = ({ project, onClick, onOpen }) => {
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
      <p
        className={[projectCardStyles.role, roleClassMap[project.role] || roleClassMap.GUEST].filter(Boolean).join(' ')}
      >
        {PROJECT_MEMBER_ROLE_LABELS[project.role] || PROJECT_MEMBER_ROLE_LABELS.GUEST}
      </p>
      <p className={projectCardStyles.tasks}>Открытых задач: {project.openTasksCount}</p>
    </button>
  );
};

export default memo(ProjectCard);

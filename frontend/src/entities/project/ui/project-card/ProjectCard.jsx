import { memo, useCallback } from 'react';
import { PROJECT_MEMBER_ROLE_LABELS, PROJECT_PRIVACY } from '../../model';
import privateIcon from '@/shared/assets/private-icon.svg';
import './ProjectCard.css';

const roleClassMap = {
  OWNER: 'project-card__role--owner',
  MEMBER: 'project-card__role--member',
  GUEST: 'project-card__role--guest',
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
    <button className="project-card" type="button" onClick={handleClick}>
      <div className="project-card__title-row">
        <h3 className="project-card__title">{project.name}</h3>
        {project.privacy === PROJECT_PRIVACY.PRIVATE && (
          <img className="project-card__privacy" src={privateIcon} alt="Приватный проект" />
        )}
      </div>
      <p className={`project-card__role ${roleClassMap[project.role] || roleClassMap.GUEST}`}>
        {PROJECT_MEMBER_ROLE_LABELS[project.role] || PROJECT_MEMBER_ROLE_LABELS.GUEST}
      </p>
      <p className="project-card__tasks">Открытых задач: {project.openTasksCount}</p>
    </button>
  );
};

export default memo(ProjectCard);

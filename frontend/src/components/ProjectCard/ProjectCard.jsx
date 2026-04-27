import { PROJECT_MEMBER_ROLE_LABELS, PROJECT_PRIVACY } from '../../constants/project';
import privateIcon from '../../assets/private-icon.svg';
import './ProjectCard.css';

const roleClassMap = {
  OWNER: 'project-card__role--owner',
  MEMBER: 'project-card__role--member',
  GUEST: 'project-card__role--guest'
};

const ProjectCard = ({ project, onClick }) => {
  return (
    <div className="project-card" type="button" onClick={onClick}>
      <div className="project-card__title-row">
        <h3 className="project-card__title">{project.name}</h3>
        {project.privacy === PROJECT_PRIVACY.PRIVATE && <img className="project-card__privacy" src={privateIcon} alt="Приватный проект" />}
      </div>
      <p className={`project-card__role ${roleClassMap[project.role] || roleClassMap.GUEST}`}>
        {PROJECT_MEMBER_ROLE_LABELS[project.role] || PROJECT_MEMBER_ROLE_LABELS.GUEST}
      </p>
      <p className="project-card__tasks">Открытых задач: {project.openTasksCount}</p>
    </div>
  );
};

export default ProjectCard;

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import Header from '../../components/Header/Header';
import ProjectCreateModal from '../../components/ProjectCreateModal/ProjectCreateModal';
import Snackbar from '../../components/Snackbar/Snackbar';
import Spinner from '../../components/Spinner/Spinner';
import { PROJECT_MEMBER_ROLE_LABELS, PROJECT_PRIVACY, PROJECT_PRIVACY_LABELS } from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { formatLastActivity, truncateText } from '../../utils/projectFormatters';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setIsLoading(true);

      try {
        const result = await projectsApi.getProjectsList(Number(userId));

        if (!isMounted) {
          return;
        }

        setProjects(result);
      } catch {
        if (isMounted) {
          setSnackbar({ message: 'Не удалось загрузить проекты', type: 'error' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      setSnackbar({
        message: location.state.snackbarMessage,
        type: location.state.snackbarType || 'success'
      });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!snackbar.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSnackbar({ message: '', type: 'success' });
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [snackbar.message]);

  const sortedProjects = useMemo(() => [...projects].sort((left, right) => right.id - left.id), [projects]);

  const handleProjectCreate = async (payload) => {
    setIsCreateSubmitting(true);

    try {
      const result = await projectsApi.createProject(payload);

      if (result?.reason === 'NOT_IMPLEMENTED') {
        setSnackbar({ message: 'Создание проекта будет доступно после подключения backend', type: 'success' });
      }
    } catch (error) {
      if (error?.code === 'PROJECT_NAME_CONFLICT') {
        setSnackbar({ message: 'Проект с таким названием уже существует', type: 'error' });
      }
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  return (
    <div className="projects-page">
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar({ message: '', type: 'success' })} />

      <main className="projects-page__content">
        <section className="projects-page__section">
          <h1 className="projects-page__title">Проекты</h1>

          {isLoading ? (
            <div className="projects-page__loader">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="projects-page__list-wrap">
                <ul className="projects-page__list">
                  {sortedProjects.map((project) => (
                    <li key={project.id}>
                      <Link className="projects-page__item" to={`${ROUTES.projects}/${project.id}`}>
                        <div className="projects-page__item-main">
                          <h2>{project.name}</h2>
                          <p>{truncateText(project.description || 'Описание не указано', 160)}</p>
                        </div>

                        <div className="projects-page__item-meta">
                          <span>{PROJECT_PRIVACY_LABELS[project.privacy || PROJECT_PRIVACY.PUBLIC]}</span>
                          <span>{PROJECT_MEMBER_ROLE_LABELS[project.role]}</span>
                          {project.organizationName && <span>{project.organizationName}</span>}
                          <span>Участников: {project.participantsCount}</span>
                          <span>Открытых задач: {project.openTasksCount}</span>
                          <span>Активность: {formatLastActivity(project.lastActivityAt)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="projects-page__create" type="button" onClick={() => setIsCreateOpen(true)}>
                Создать проект
              </button>
            </>
          )}
        </section>
      </main>

      <ProjectCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleProjectCreate}
        isSubmitting={isCreateSubmitting}
      />
    </div>
  );
};

export default ProjectsPage;

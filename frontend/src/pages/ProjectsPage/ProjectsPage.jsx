import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import Header from '../../components/Header/Header';
import JoinSearchModal from '../../components/JoinSearchModal/JoinSearchModal';
import OrganizationCreateModal from '../../components/OrganizationCreateModal/OrganizationCreateModal';
import OrganizationProjectsCard from '../../components/OrganizationProjectsCard/OrganizationProjectsCard';
import OrganizationsSidebar from '../../components/OrganizationsSidebar/OrganizationsSidebar';
import { ArrowIcon, SearchIcon } from '../../components/Icons/Icons';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import ProjectCreateModal from '../../components/ProjectCreateModal/ProjectCreateModal';
import Snackbar from '../../components/Snackbar/Snackbar';
import Spinner from '../../components/Spinner/Spinner';
import { PROJECT_MEMBER_ROLE } from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './ProjectsPage.css';

const VIEW_MODE = {
  WITHOUT_ORGANIZATION: 'WITHOUT_ORGANIZATION',
  WITH_ORGANIZATION: 'WITH_ORGANIZATION'
};

const roleWeight = {
  [PROJECT_MEMBER_ROLE.OWNER]: 0,
  [PROJECT_MEMBER_ROLE.MEMBER]: 1,
  [PROJECT_MEMBER_ROLE.GUEST]: 2
};

const CAROUSEL_PADDING = 10;

const ProjectsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [viewMode, setViewMode] = useState(VIEW_MODE.WITHOUT_ORGANIZATION);
  const [search, setSearch] = useState('');
  const [dashboard, setDashboard] = useState({ withoutOrganizationProjects: [], organizationsWithProjects: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });
  const [noOrgVisibleCount, setNoOrgVisibleCount] = useState(24);

  const [isProjectCreateOpen, setProjectCreateOpen] = useState(false);
  const [isProjectCreateSubmitting, setProjectCreateSubmitting] = useState(false);

  const [isOrganizationCreateOpen, setOrganizationCreateOpen] = useState(false);
  const [isOrganizationCreateSubmitting, setOrganizationCreateSubmitting] = useState(false);

  const [isProjectsSearchOpen, setProjectsSearchOpen] = useState(false);
  const [isOrganizationsSearchOpen, setOrganizationsSearchOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [carouselStart, setCarouselStart] = useState(0);
  const [trackOffset, setTrackOffset] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const carouselViewportRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await projectsApi.getProjectsDashboard(Number(userId));
      setDashboard(result);
    } catch {
      setSnackbar({ message: 'Не удалось загрузить список проектов', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSnackbar({ message: '', type: 'success' });
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [snackbar.message]);

  useEffect(() => {
    if (viewMode === VIEW_MODE.WITHOUT_ORGANIZATION) {
      setNoOrgVisibleCount(24);
    }
  }, [search, viewMode]);

  const noOrganizationProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return dashboard.withoutOrganizationProjects
      .filter((project) => {
        if (!normalizedSearch) {
          return true;
        }

        return `${project.name} ${project.description}`.toLowerCase().includes(normalizedSearch);
      })
      .sort((left, right) => {
        const roleDiff = (roleWeight[left.role] || 2) - (roleWeight[right.role] || 2);

        if (roleDiff !== 0) {
          return roleDiff;
        }

        return left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' });
      });
  }, [dashboard.withoutOrganizationProjects, search]);

  const visibleNoOrganizationProjects = useMemo(
    () => noOrganizationProjects.slice(0, noOrgVisibleCount),
    [noOrgVisibleCount, noOrganizationProjects]
  );

  const hasMoreNoOrganizationProjects = visibleNoOrganizationProjects.length < noOrganizationProjects.length;

  const organizationsWithProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const sortedOrganizations = [...dashboard.organizationsWithProjects].sort((left, right) => left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' }));

    if (!normalizedSearch) {
      return sortedOrganizations;
    }

    return sortedOrganizations
      .map((organization) => {
        const organizationMatches = `${organization.name} ${organization.description}`.toLowerCase().includes(normalizedSearch);
        const filteredProjects = organization.projects.filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(normalizedSearch));

        if (!organizationMatches && filteredProjects.length === 0) {
          return null;
        }

        return {
          ...organization,
          projects: organizationMatches ? organization.projects : filteredProjects
        };
      })
      .filter(Boolean);
  }, [dashboard.organizationsWithProjects, search]);

  useEffect(() => {
    const maxStart = Math.max(0, organizationsWithProjects.length - cardsPerView);
    setCarouselStart((prev) => Math.min(prev, maxStart));
  }, [cardsPerView, organizationsWithProjects.length]);

  useEffect(() => {
    if (organizationsWithProjects.length <= 1 && cardsPerView === 2) {
      setTrackOffset(0);
      return;
    }

    const viewportWidth = carouselViewportRef.current?.clientWidth || 0;

    if (!viewportWidth) {
      return;
    }

    const contentWidth = viewportWidth - CAROUSEL_PADDING * 2;
    const slideWidth = cardsPerView === 1 ? contentWidth : (contentWidth - 20) / 2;
    setTrackOffset(carouselStart * (slideWidth + 20));
  }, [cardsPerView, carouselStart, organizationsWithProjects.length]);

  useEffect(() => {
    if (viewMode !== VIEW_MODE.WITH_ORGANIZATION) {
      return;
    }

    const updateCardsPerView = () => {
      const viewportWidth = carouselViewportRef.current?.clientWidth || 0;
      if (!viewportWidth) {
        return;
      }

      const nextCardsPerView = viewportWidth <= 800 ? 1 : 2;
      setCardsPerView(nextCardsPerView);
    };

    const resizeHandler = () => {
      const viewportWidth = carouselViewportRef.current?.clientWidth || 0;
      if (!viewportWidth) {
        return;
      }

      const nextCardsPerView = viewportWidth <= 800 ? 1 : 2;

      setCardsPerView(nextCardsPerView);

      if (organizationsWithProjects.length <= 1 && nextCardsPerView === 2) {
        setTrackOffset(0);
        return;
      }

      if (!viewportWidth) {
        return;
      }

      const contentWidth = viewportWidth - CAROUSEL_PADDING * 2;
      const slideWidth = nextCardsPerView === 1 ? contentWidth : (contentWidth - 20) / 2;
      setTrackOffset(carouselStart * (slideWidth + 20));
    };

    const frameId = window.requestAnimationFrame(updateCardsPerView);
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeHandler);
    };
  }, [carouselStart, organizationsWithProjects.length, viewMode]);

  const canSlideLeft = carouselStart > 0;
  const canSlideRight = carouselStart + cardsPerView < organizationsWithProjects.length;
  const shouldShowArrows = organizationsWithProjects.length > cardsPerView;

  const openProject = (projectId) => {
    navigate(`${ROUTES.projects}/${projectId}`);
  };

  const handleCreateProject = async (payload) => {
    setProjectCreateSubmitting(true);

    try {
      const result = await projectsApi.createProject(payload);

      if (result?.reason === 'NOT_IMPLEMENTED') {
        setSnackbar({ message: 'Создание проекта будет доступно после подключения backend', type: 'success' });
      }
    } catch (error) {
      if (error?.code === 'PROJECT_NAME_CONFLICT') {
        setSnackbar({ message: 'Проект с таким названием уже существует', type: 'error' });
        return;
      }

      setSnackbar({ message: 'Не удалось создать проект. Попробуйте позже', type: 'error' });
    } finally {
      setProjectCreateSubmitting(false);
    }
  };

  const handleCreateOrganization = async (payload) => {
    if (!payload.logoPreview) {
      setSnackbar({ message: 'Прикрепите лого организации', type: 'error' });
      return;
    }

    setOrganizationCreateSubmitting(true);

    try {
      const result = await projectsApi.createOrganization(payload);

      if (result?.reason === 'NOT_IMPLEMENTED') {
        setSnackbar({ message: 'Создание организации будет доступно после подключения backend', type: 'success' });
      }
    } catch (error) {
      if (error?.code === 'ORGANIZATION_NAME_CONFLICT') {
        setSnackbar({ message: 'Организация с таким названием существует', type: 'error' });
        return;
      }

      setSnackbar({ message: 'Не удалось создать организацию. Попробуйте позже', type: 'error' });
    } finally {
      setOrganizationCreateSubmitting(false);
    }
  };

  const fetchProjectsForJoin = useCallback(
    async ({ query, page, pageSize }) => {
      return projectsApi.searchProjectsForJoin(Number(userId), { query, page, pageSize });
    },
    [userId]
  );

  const fetchOrganizationsForJoin = useCallback(
    async ({ query, page, pageSize }) => {
      return projectsApi.searchOrganizations(Number(userId), { query, page, pageSize });
    },
    [userId]
  );

  const handleJoinProject = async (projectId) => {
    try {
      await projectsApi.joinPublicProject(projectId, Number(userId));
      await loadDashboard();
      setSnackbar({ message: 'Вы вступили в проект', type: 'success' });
    } catch {
      setSnackbar({ message: 'Не удалось вступить в проект', type: 'error' });
    }
  };

  const handleRequestOrganizationAccess = async (organizationId) => {
    try {
      await projectsApi.requestOrganizationAccess(organizationId, Number(userId));
      setSnackbar({ message: 'Запрос на вступление отправлен владельцу организации', type: 'success' });
    } catch {
      setSnackbar({ message: 'Не удалось отправить запрос на вступление', type: 'error' });
    }
  };

  return (
    <div className="projects-page">
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar({ message: '', type: 'success' })} />

      <main className="projects-page__content">
        <section className="projects-page__toolbar-wrap">
          <div className="projects-page__toolbar">
            <div className={`projects-page__toolbar-left ${viewMode === VIEW_MODE.WITH_ORGANIZATION ? '' : 'projects-page__toolbar-left--hidden'}`}>
              {viewMode === VIEW_MODE.WITH_ORGANIZATION && (
                <button className="projects-page__side-action projects-page__side-action--org" type="button" onClick={() => setSidebarOpen(true)}>
                  Мои организации
                </button>
              )}
            </div>

            <div className="projects-page__switch" role="tablist" aria-label="Режим просмотра проектов">
              <span className={`projects-page__switch-thumb ${viewMode === VIEW_MODE.WITH_ORGANIZATION ? 'projects-page__switch-thumb--with-org' : ''}`} />
              <button
                className={`projects-page__switch-option ${viewMode === VIEW_MODE.WITHOUT_ORGANIZATION ? 'projects-page__switch-option--active' : ''}`}
                type="button"
                onClick={() => setViewMode(VIEW_MODE.WITHOUT_ORGANIZATION)}
              >
                Без организации
              </button>
              <button
                className={`projects-page__switch-option ${viewMode === VIEW_MODE.WITH_ORGANIZATION ? 'projects-page__switch-option--active' : ''}`}
                type="button"
                onClick={() => setViewMode(VIEW_MODE.WITH_ORGANIZATION)}
              >
                С организацией
              </button>
            </div>

            <div className="projects-page__search-wrap">
              <SearchIcon />
              <input className="projects-page__search" type="text" placeholder="Поиск" value={search} onChange={(event) => setSearch(event.target.value.slice(0, 120))} />
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="projects-page__loader">
            <Spinner />
          </div>
        ) : viewMode === VIEW_MODE.WITHOUT_ORGANIZATION ? (
          <>
            <section className="projects-page__section-wrap">
              <div className="projects-page__section">
                <h1 className="projects-page__title">Мои проекты</h1>

                {visibleNoOrganizationProjects.length === 0 ? (
                  <p className="projects-page__empty">У вас пока нет проектов</p>
                ) : (
                  <div className="projects-page__projects-grid">
                    {visibleNoOrganizationProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} onClick={() => openProject(project.id)} />
                    ))}
                  </div>
                )}

                {hasMoreNoOrganizationProjects && (
                  <button className="projects-page__load-more" type="button" onClick={() => setNoOrgVisibleCount((prev) => prev + 24)}>
                    Загрузить еще
                  </button>
                )}
              </div>
            </section>

            <div className="projects-page__actions">
              <button className="projects-page__side-action projects-page__side-action--create" type="button" onClick={() => setProjectCreateOpen(true)}>
                Создать проект
              </button>
              <button className="projects-page__side-action projects-page__side-action--join" type="button" onClick={() => setProjectsSearchOpen(true)}>
                Присоединиться
              </button>
            </div>
          </>
        ) : (
          <>
            <section className="projects-page__organizations-wrap">
              <div className="projects-page__arrow-slot">
                {shouldShowArrows && (
                  <button
                    className={`projects-page__arrow projects-page__arrow--left ${canSlideLeft ? '' : 'projects-page__arrow--disabled'}`}
                    type="button"
                    onClick={() => canSlideLeft && setCarouselStart((prev) => prev - 1)}
                    disabled={!canSlideLeft}
                    aria-label="Показать предыдущие организации"
                  >
                    <ArrowIcon />
                  </button>
                )}
              </div>

              <div className="projects-page__organizations-viewport" ref={carouselViewportRef}>
                {organizationsWithProjects.length === 0 ? (
                  <p className="projects-page__empty projects-page__empty--org">Создайте свою организацию или присоединитесь к существующей</p>
                ) : (
                  <div
                    className={`projects-page__organizations-track ${cardsPerView === 1 ? 'projects-page__organizations-track--single' : 'projects-page__organizations-track--double'} ${organizationsWithProjects.length === 1 ? 'projects-page__organizations-track--single-item' : ''}`}
                    style={{ transform: `translateX(-${trackOffset}px)` }}
                  >
                    {organizationsWithProjects.map((organization) => (
                      <div className="projects-page__organizations-slide" key={organization.id}>
                        <OrganizationProjectsCard organization={organization} onProjectOpen={openProject} onCreateProject={() => setProjectCreateOpen(true)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="projects-page__arrow-slot">
                {shouldShowArrows && (
                  <button
                    className={`projects-page__arrow ${canSlideRight ? '' : 'projects-page__arrow--disabled'}`}
                    type="button"
                    onClick={() => canSlideRight && setCarouselStart((prev) => prev + 1)}
                    disabled={!canSlideRight}
                    aria-label="Показать следующие организации"
                  >
                    <ArrowIcon />
                  </button>
                )}
              </div>
            </section>

            <div className="projects-page__actions">
              <button className="projects-page__side-action projects-page__side-action--create" type="button" onClick={() => setOrganizationCreateOpen(true)}>
                Создать организацию
              </button>
              <button className="projects-page__side-action projects-page__side-action--join" type="button" onClick={() => setOrganizationsSearchOpen(true)}>
                Присоединиться
              </button>
            </div>
          </>
        )}
      </main>

      <ProjectCreateModal
        isOpen={isProjectCreateOpen}
        onClose={() => setProjectCreateOpen(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isProjectCreateSubmitting}
      />

      <OrganizationCreateModal
        isOpen={isOrganizationCreateOpen}
        onClose={() => setOrganizationCreateOpen(false)}
        onSubmit={handleCreateOrganization}
        isSubmitting={isOrganizationCreateSubmitting}
      />

      <OrganizationsSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} viewerId={Number(userId)} />

      {isProjectsSearchOpen && (
        <JoinSearchModal
          mode="projects"
          fetchItems={fetchProjectsForJoin}
          onClose={() => setProjectsSearchOpen(false)}
          onJoin={handleJoinProject}
        />
      )}

      {isOrganizationsSearchOpen && (
        <JoinSearchModal
          mode="organizations"
          fetchItems={fetchOrganizationsForJoin}
          onClose={() => setOrganizationsSearchOpen(false)}
          onRequestAccess={handleRequestOrganizationAccess}
        />
      )}
    </div>
  );
};

export default ProjectsPage;

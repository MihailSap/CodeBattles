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
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSnackbar } from '../../hooks/useSnackbar';
import './ProjectsPage.css';

const VIEW_MODE = {
  WITHOUT_ORGANIZATION: 'WITHOUT_ORGANIZATION',
  WITH_ORGANIZATION: 'WITH_ORGANIZATION'
};

const CAROUSEL_PADDING = 10;

const ProjectsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [viewMode, setViewMode] = useState(VIEW_MODE.WITH_ORGANIZATION);
  const [search, setSearch] = useState('');
  const debaouncedSearch = useDebouncedValue(search, 300);
  const [dashboard, setDashboard] = useState({ withoutOrganizationProjects: [], organizationsWithProjects: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const [isProjectCreateOpen, setProjectCreateOpen] = useState(false);
  const [isProjectCreateSubmitting, setProjectCreateSubmitting] = useState(false);
  const [createProjectOrganizationId, setCreateProjectOrganizationId] = useState(null);

  const [isOrganizationCreateOpen, setOrganizationCreateOpen] = useState(false);
  const [isOrganizationCreateSubmitting, setOrganizationCreateSubmitting] = useState(false);

  const [isProjectsSearchOpen, setProjectsSearchOpen] = useState(false);
  const [isOrganizationsSearchOpen, setOrganizationsSearchOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [carouselStart, setCarouselStart] = useState(0);
  const [trackOffset, setTrackOffset] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const carouselViewportRef = useRef(null);

  const loadDashboard = useCallback(async ({ resetNoOrg = true } = {}) => {
    setIsLoading(true);

    try {
      const result = await projectsApi.getProjectsDashboard({ search: debaouncedSearch });

      setDashboard((prev) => ({
        ...result,
        withoutOrganizationProjects: resetNoOrg
          ? result.withoutOrganizationProjects
          : [...prev.withoutOrganizationProjects, ...result.withoutOrganizationProjects]
      }));
    } catch {
      showSnackbar('Не удалось загрузить список проектов', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [debaouncedSearch, showSnackbar]);

  useEffect(() => {
    loadDashboard({ resetNoOrg: true });
  }, [loadDashboard]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      showSnackbar(location.state.snackbarMessage, location.state.snackbarType || 'success');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, showSnackbar]);

  const noOrganizationProjects = useMemo(() => dashboard.withoutOrganizationProjects, [dashboard.withoutOrganizationProjects]);

  const organizationsWithProjects = useMemo(() => dashboard.organizationsWithProjects, [dashboard.organizationsWithProjects]);

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
      const result = await projectsApi.createProject({
        ...payload,
        organizationId: createProjectOrganizationId
      });
      const projectId = result?.projectId;

      if (projectId) {
        setProjectCreateOpen(false);
        setCreateProjectOrganizationId(null);
        navigate(ROUTES.projectById.replace(':projectId', projectId), { replace: true });
      }
    } catch (error) {
      if (error?.code === 'PROJECT_NAME_CONFLICT') {
        showSnackbar('Проект с таким названием уже существует', 'error');
        return;
      }

      showSnackbar('Не удалось создать проект. Попробуйте позже', 'error');
    } finally {
      setProjectCreateSubmitting(false);
    }
  };

  const handleCreateOrganization = async (payload) => {
    if (!payload.logoPreview) {
      showSnackbar('Прикрепите лого организации', 'error');
      return;
    }

    setOrganizationCreateSubmitting(true);

    try {
      const result = await projectsApi.createOrganization(payload);
      const organizationId = result?.organizationId;

      if (organizationId) {
        setOrganizationCreateOpen(false);
        navigate(ROUTES.organizationById.replace(':organizationId', organizationId), { replace: true });
      }
    } catch (error) {
      if (error?.code === 'ORGANIZATION_NAME_CONFLICT') {
        showSnackbar('Организация с таким названием существует', 'error');
        return;
      }

      showSnackbar('Не удалось создать организацию. Попробуйте позже', 'error');
    } finally {
      setOrganizationCreateSubmitting(false);
    }
  };

  const fetchProjectsForJoin = useCallback(
    async ({ query }) => {
      return projectsApi.searchProjectsForJoin(Number(userId), { query });
    },
    [userId]
  );

  const fetchOrganizationsForJoin = useCallback(
    async ({ query }) => {
      return projectsApi.searchOrganizations(Number(userId), { query });
    },
    [userId]
  );

  const handleJoinProject = async (projectId) => {
    try {
      await projectsApi.joinPublicProject(projectId);
      await loadDashboard();
      showSnackbar('Вы вступили в проект', 'success');
    } catch {
      showSnackbar('Не удалось вступить в проект', 'error');
    }
  };

  const handleRequestOrganizationAccess = async (organizationId) => {
    try {
      await projectsApi.requestOrganizationAccess(organizationId);
      showSnackbar('Запрос на вступление отправлен владельцу организации', 'success');
    } catch {
      showSnackbar('Не удалось отправить запрос на вступление', 'error');
    }
  };

  return (
    <div className="projects-page">
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

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
              <span className={`projects-page__switch-thumb ${viewMode === VIEW_MODE.WITHOUT_ORGANIZATION ? 'projects-page__switch-thumb--with-org' : ''}`} />
              <button
                className={`projects-page__switch-option ${viewMode === VIEW_MODE.WITH_ORGANIZATION ? 'projects-page__switch-option--active' : ''}`}
                type="button"
                onClick={() => setViewMode(VIEW_MODE.WITH_ORGANIZATION)}
              >
                С организацией
              </button>
              <button
                className={`projects-page__switch-option ${viewMode === VIEW_MODE.WITHOUT_ORGANIZATION ? 'projects-page__switch-option--active' : ''}`}
                type="button"
                onClick={() => setViewMode(VIEW_MODE.WITHOUT_ORGANIZATION)}
              >
                Без организации
              </button>
            </div>

            <div className="projects-page__search-wrap">
              <SearchIcon />
              <input className="projects-page__search" type="search" placeholder="Поиск" value={search} onChange={(event) => setSearch(event.target.value.slice(0, 120))} />
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

                {noOrganizationProjects.length === 0 ? (
                  <p className="projects-page__empty">У вас пока нет проектов</p>
                ) : (
                  <div className="projects-page__projects-grid">
                    {noOrganizationProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} onClick={() => openProject(project.id)} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="projects-page__actions">
              <button
                className="projects-page__side-action projects-page__side-action--create"
                type="button"
                onClick={() => {
                  setCreateProjectOrganizationId(null);
                  setProjectCreateOpen(true);
                }}
              >
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
                        <OrganizationProjectsCard
                          organization={organization}
                          onProjectOpen={openProject}
                          onCreateProject={(organizationId) => {
                            setCreateProjectOrganizationId(organizationId);
                            setProjectCreateOpen(true);
                          }}
                        />
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
        onClose={() => {
          setProjectCreateOpen(false);
          setCreateProjectOrganizationId(null);
        }}
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

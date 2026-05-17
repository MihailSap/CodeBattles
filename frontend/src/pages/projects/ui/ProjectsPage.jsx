import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useCreateOrganizationMutation,
  useCreateProjectMutation,
  useGetProjectsDashboardQuery,
  useJoinPublicProjectMutation,
  useLazySearchOrganizationsQuery,
  useLazySearchProjectsForJoinQuery,
  useRequestOrganizationAccessMutation
} from '@/entities/project';
import OrganizationProjectsCard from '@/widgets/organization-projects-card';
import OrganizationsSidebar from '@/widgets/organizations-sidebar';
import { ArrowIcon, SearchIcon } from '@/shared/ui/icons';
import { ProjectCard } from '@/entities/project';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { useDebouncedValue } from '@/shared/lib/hooks';
import { useSnackbar } from '@/shared/lib/hooks';
import { lazyNamed } from '@/shared/lib';
import './ProjectsPage.css';

const JoinSearchModal = lazyNamed(() => import('@/features/join-project'), 'JoinSearchModal');
const OrganizationCreateModal = lazyNamed(() => import('@/features/create-organization'), 'OrganizationCreateModal');
const ProjectCreateModal = lazyNamed(() => import('@/features/create-project'), 'ProjectCreateModal');

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
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const [isProjectCreateOpen, setProjectCreateOpen] = useState(false);
  const [createProjectOrganizationId, setCreateProjectOrganizationId] = useState(null);

  const [isOrganizationCreateOpen, setOrganizationCreateOpen] = useState(false);

  const [isProjectsSearchOpen, setProjectsSearchOpen] = useState(false);
  const [isOrganizationsSearchOpen, setOrganizationsSearchOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [carouselStart, setCarouselStart] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const [carouselViewportWidth, setCarouselViewportWidth] = useState(0);
  const carouselViewportRef = useRef(null);
  const {
    data: dashboard = { withoutOrganizationProjects: [], organizationsWithProjects: [] },
    isLoading,
    isError,
    refetch: refetchDashboard
  } = useGetProjectsDashboardQuery(
    { search: debaouncedSearch },
    { refetchOnMountOrArgChange: 30 }
  );
  const [createProject, { isLoading: isProjectCreateSubmitting }] = useCreateProjectMutation();
  const [createOrganization, { isLoading: isOrganizationCreateSubmitting }] = useCreateOrganizationMutation();
  const [joinPublicProject] = useJoinPublicProjectMutation();
  const [requestOrganizationAccess] = useRequestOrganizationAccessMutation();
  const [searchProjectsForJoin] = useLazySearchProjectsForJoinQuery();
  const [searchOrganizations] = useLazySearchOrganizationsQuery();

  useEffect(() => {
    if (isError) {
      showSnackbar('Не удалось загрузить список проектов', 'error');
    }
  }, [isError, showSnackbar]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      showSnackbar(location.state.snackbarMessage, location.state.snackbarType || 'success');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, showSnackbar]);

  const noOrganizationProjects = useMemo(() => dashboard.withoutOrganizationProjects, [dashboard.withoutOrganizationProjects]);

  const organizationsWithProjects = useMemo(() => dashboard.organizationsWithProjects, [dashboard.organizationsWithProjects]);

  const maxCarouselStart = Math.max(0, organizationsWithProjects.length - cardsPerView);
  const boundedCarouselStart = Math.min(carouselStart, maxCarouselStart);

  const trackOffset = useMemo(() => {
    if (organizationsWithProjects.length <= 1 && cardsPerView === 2) {
      return 0;
    }

    if (!carouselViewportWidth) {
      return 0;
    }

    const contentWidth = carouselViewportWidth - CAROUSEL_PADDING * 2;
    const slideWidth = cardsPerView === 1 ? contentWidth : (contentWidth - 20) / 2;
    return boundedCarouselStart * (slideWidth + 20);
  }, [boundedCarouselStart, cardsPerView, carouselViewportWidth, organizationsWithProjects.length]);

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
      setCarouselViewportWidth(viewportWidth);
    };

    const resizeHandler = () => {
      const viewportWidth = carouselViewportRef.current?.clientWidth || 0;
      if (!viewportWidth) {
        return;
      }

      const nextCardsPerView = viewportWidth <= 800 ? 1 : 2;

      setCardsPerView(nextCardsPerView);
      setCarouselViewportWidth(viewportWidth);
    };

    const frameId = window.requestAnimationFrame(updateCardsPerView);
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeHandler);
    };
  }, [viewMode]);

  const canSlideLeft = boundedCarouselStart > 0;
  const canSlideRight = boundedCarouselStart + cardsPerView < organizationsWithProjects.length;
  const shouldShowArrows = organizationsWithProjects.length > cardsPerView;

  const openProject = useCallback((projectId) => {
    navigate(`${ROUTES.projects}/${projectId}`);
  }, [navigate]);

  const handleCreateProject = useCallback(async (payload) => {
    try {
      const result = await createProject({
        ...payload,
        organizationId: createProjectOrganizationId
      }).unwrap();
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
    }
  }, [createProject, createProjectOrganizationId, navigate, showSnackbar]);

  const handleCreateOrganization = useCallback(async (payload) => {
    if (!payload.logoPreview) {
      showSnackbar('Прикрепите лого организации', 'error');
      return;
    }

    try {
      const result = await createOrganization(payload).unwrap();
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
    }
  }, [createOrganization, navigate, showSnackbar]);

  const fetchProjectsForJoin = useCallback(
    async ({ query }) => {
      return searchProjectsForJoin({ viewerId: Number(userId), params: { query } }, true).unwrap();
    },
    [searchProjectsForJoin, userId]
  );

  const fetchOrganizationsForJoin = useCallback(
    async ({ query }) => {
      return searchOrganizations({ viewerId: Number(userId), params: { query } }, true).unwrap();
    },
    [searchOrganizations, userId]
  );

  const handleJoinProject = useCallback(async (projectId) => {
    try {
      await joinPublicProject(projectId).unwrap();
      await refetchDashboard();
      showSnackbar('Вы вступили в проект', 'success');
    } catch {
      showSnackbar('Не удалось вступить в проект', 'error');
    }
  }, [joinPublicProject, refetchDashboard, showSnackbar]);

  const handleRequestOrganizationAccess = useCallback(async (organizationId) => {
    try {
      await requestOrganizationAccess(organizationId).unwrap();
      showSnackbar('Запрос на вступление отправлен владельцу организации', 'success');
    } catch {
      showSnackbar('Не удалось отправить запрос на вступление', 'error');
    }
  }, [requestOrganizationAccess, showSnackbar]);

  const handleCreateProjectForOrganization = useCallback((organizationId) => {
    setCreateProjectOrganizationId(organizationId);
    setProjectCreateOpen(true);
  }, []);

  return (
    <div className="projects-page">
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
                      <ProjectCard key={project.id} project={project} onOpen={openProject} />
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
                    onClick={() => canSlideLeft && setCarouselStart(boundedCarouselStart - 1)}
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
                          onCreateProject={handleCreateProjectForOrganization}
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
                    onClick={() => canSlideRight && setCarouselStart(boundedCarouselStart + 1)}
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

      <Suspense fallback={null}>
        {isProjectCreateOpen && (
          <ProjectCreateModal
            isOpen={isProjectCreateOpen}
            onClose={() => {
              setProjectCreateOpen(false);
              setCreateProjectOrganizationId(null);
            }}
            onSubmit={handleCreateProject}
            isSubmitting={isProjectCreateSubmitting}
          />
        )}

        {isOrganizationCreateOpen && (
          <OrganizationCreateModal
            isOpen={isOrganizationCreateOpen}
            onClose={() => setOrganizationCreateOpen(false)}
            onSubmit={handleCreateOrganization}
            isSubmitting={isOrganizationCreateSubmitting}
          />
        )}
      </Suspense>

      <OrganizationsSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} viewerId={Number(userId)} />

      {isProjectsSearchOpen && (
        <Suspense fallback={null}>
          <JoinSearchModal
            mode="projects"
            fetchItems={fetchProjectsForJoin}
            onClose={() => setProjectsSearchOpen(false)}
            onJoin={handleJoinProject}
          />
        </Suspense>
      )}

      {isOrganizationsSearchOpen && (
        <Suspense fallback={null}>
          <JoinSearchModal
            mode="organizations"
            fetchItems={fetchOrganizationsForJoin}
            onClose={() => setOrganizationsSearchOpen(false)}
            onRequestAccess={handleRequestOrganizationAccess}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ProjectsPage;

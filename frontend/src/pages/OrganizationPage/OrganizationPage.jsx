import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import participantsCountIcon from '../../assets/participants-count-icon.svg';
import projectsCountIcon from '../../assets/projects-count-icon.svg';
import uploadIcon from '../../assets/upload-icon.svg';
import { projectsApi } from '../../api/projectsApi';
import ConfirmActionModal from '../../components/ConfirmActionModal/ConfirmActionModal';
import EntityTabs from '../../components/EntityTabs/EntityTabs';
import { AvatarIcon, CheckIcon, CrossIcon, SearchIcon } from '../../components/Icons/Icons';
import Header from '../../components/Header/Header';
import InviteLinkModal from '../../components/InviteLinkModal/InviteLinkModal';
import ProjectCreateModal from '../../components/ProjectCreateModal/ProjectCreateModal';
import Snackbar from '../../components/Snackbar/Snackbar';
import Spinner from '../../components/Spinner/Spinner';
import { ACCESS_ERROR_CODE, PROJECT_MEMBER_ROLE, PROJECT_MEMBER_ROLE_LABELS } from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useVisibleItems } from '../../hooks/useVisibleItems';
import { sortParticipants, truncateText } from '../../utils/projectFormatters';
import { validateOrganizationName, validateOrganizationUrl } from '../../utils/organizationValidation';
import './OrganizationPage.css';

const tabs = {
  projects: 'Проекты',
  participants: 'Участники',
  settings: 'Настройки'
};

const roleWeight = {
  [PROJECT_MEMBER_ROLE.OWNER]: 0,
  [PROJECT_MEMBER_ROLE.MEMBER]: 1,
  [PROJECT_MEMBER_ROLE.GUEST]: 2
};

const OrganizationPage = () => {
  const { userId } = useAuth();
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const logoInputRef = useRef(null);

  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [participantsMode, setParticipantsMode] = useState('members');
  const [projectSearch, setProjectSearch] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviteSubmitting, setInviteSubmitting] = useState(false);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleteSubmitting, setDeleteSubmitting] = useState(false);

  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isLeaveSubmitting, setLeaveSubmitting] = useState(false);

  const [isCreateProjectOpen, setCreateProjectOpen] = useState(false);
  const [isCreateProjectSubmitting, setCreateProjectSubmitting] = useState(false);

  const [isSettingsSubmitting, setSettingsSubmitting] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsTouched, setSettingsTouched] = useState({ name: false, link: false });
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });

  const loadOrganization = async (id, viewerId) => {
    const result = await projectsApi.getOrganizationById(id, viewerId);
    setOrganization(result);
    setSettingsDraft({
      name: result.name,
      description: result.description,
      link: result.link,
      logoUrl: result.logoUrl
    });
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        await loadOrganization(Number(organizationId), Number(userId));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.status === 403 && error?.code === ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION) {
          navigate(ROUTES.projects, {
            replace: true,
            state: {
              snackbarMessage: 'Необходимо присоединиться к организации для просмотра'
            }
          });
          return;
        }

        navigate(ROUTES.projects, { replace: true });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [navigate, organizationId, userId]);

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
    return () => {
      if (settingsDraft?.logoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(settingsDraft.logoUrl);
      }
    };
  }, [settingsDraft?.logoUrl]);

  const isOwner = organization?.viewerRole === PROJECT_MEMBER_ROLE.OWNER;

  const availableTabs = useMemo(() => {
    const baseTabs = [
      { key: 'projects', label: tabs.projects },
      { key: 'participants', label: tabs.participants }
    ];

    if (isOwner) {
      baseTabs.push({ key: 'settings', label: tabs.settings });
    }

    return baseTabs;
  }, [isOwner]);

  const projectsSource = useMemo(() => {
    if (!organization) {
      return [];
    }

    const normalizedSearch = projectSearch.trim().toLowerCase();

    return [...organization.projects]
      .filter((project) => {
        if (!normalizedSearch) {
          return true;
        }

        return `${project.name} ${project.description}`.toLowerCase().includes(normalizedSearch);
      })
      .sort((left, right) => {
        const roleDiff = (roleWeight[left.viewerRole] ?? 2) - (roleWeight[right.viewerRole] ?? 2);

        if (roleDiff !== 0) {
          return roleDiff;
        }

        return left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' });
      });
  }, [organization, projectSearch]);

  const { visibleItems: visibleProjects, hasMore: hasMoreProjects, sentinelRef: projectsSentinelRef } = useVisibleItems(projectsSource, 20);

  const participantsSource = useMemo(() => sortParticipants(organization?.participants || []), [organization?.participants]);
  const { visibleItems: visibleParticipants, hasMore: hasMoreParticipants, sentinelRef: participantsSentinelRef } = useVisibleItems(participantsSource, 12);

  const requestsSource = useMemo(
    () => [...(organization?.joinRequests || [])].sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru', { sensitivity: 'base' })),
    [organization?.joinRequests]
  );
  const { visibleItems: visibleRequests, hasMore: hasMoreRequests, sentinelRef: requestsSentinelRef } = useVisibleItems(requestsSource, 12);

  const settingsNameError = useMemo(() => validateOrganizationName(settingsDraft?.name || ''), [settingsDraft?.name]);
  const settingsLinkError = useMemo(() => validateOrganizationUrl(settingsDraft?.link || ''), [settingsDraft?.link]);
  const settingsFormInvalid = Boolean(settingsNameError || settingsLinkError);

  const hasSettingsChanges = useMemo(() => {
    if (!organization || !settingsDraft) {
      return false;
    }

    return (
      settingsDraft.name !== organization.name ||
      settingsDraft.description !== organization.description ||
      settingsDraft.link !== organization.link ||
      settingsDraft.logoUrl !== organization.logoUrl
    );
  }, [organization, settingsDraft]);

  const handleInviteGenerate = async (payload) => {
    if (!organization) {
      return null;
    }

    setInviteSubmitting(true);

    try {
      return await projectsApi.generateOrganizationInvite(organization.id, payload);
    } catch {
      setSnackbar({ message: 'Не удалось сформировать ссылку. Попробуйте позже', type: 'error' });
      return null;
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCreateProject = async (payload) => {
    if (!organization) {
      return;
    }

    setCreateProjectSubmitting(true);

    try {
      const result = await projectsApi.createProject({ ...payload, organizationId: organization.id });

      if (result?.reason === 'NOT_IMPLEMENTED') {
        setSnackbar({ message: 'Создание проекта будет доступно после подключения backend', type: 'success' });
        setCreateProjectOpen(false);
      }
    } catch (error) {
      if (error?.code === 'PROJECT_NAME_CONFLICT') {
        setSnackbar({ message: 'Проект с таким названием уже существует', type: 'error' });
      } else {
        setSnackbar({ message: 'Не удалось создать проект. Попробуйте позже', type: 'error' });
      }
    } finally {
      setCreateProjectSubmitting(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!organization) {
      return;
    }

    setLeaveSubmitting(true);

    try {
      await projectsApi.leaveOrganization(organization.id, Number(userId));
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Вы вышли из организации',
          snackbarType: 'success'
        }
      });
    } catch {
      setSnackbar({ message: 'Не удалось выйти из организации', type: 'error' });
    } finally {
      setLeaveSubmitting(false);
      setLeaveModalOpen(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organization) {
      return;
    }

    setDeleteSubmitting(true);

    try {
      await projectsApi.deleteOrganization(organization.id);
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Организация удалена',
          snackbarType: 'success'
        }
      });
    } catch {
      setSnackbar({ message: 'Не удалось удалить организацию', type: 'error' });
    } finally {
      setDeleteSubmitting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!organization) {
      return;
    }

    try {
      await projectsApi.rejectOrganizationJoinRequest(organization.id, request.userId);
      await loadOrganization(organization.id, Number(userId));
      setSnackbar({ message: `Вы отклонили заявку пользователя @${request.login}`, type: 'error' });
    } catch {
      setSnackbar({ message: 'Не удалось отклонить заявку', type: 'error' });
    }
  };

  const handleApproveRequest = async (request) => {
    if (!organization) {
      return;
    }

    try {
      await projectsApi.approveOrganizationJoinRequest(organization.id, request.userId);
      await loadOrganization(organization.id, Number(userId));
      setSnackbar({ message: `Вы приняли заявку пользователя @${request.login}`, type: 'success' });
    } catch {
      setSnackbar({ message: 'Не удалось принять заявку', type: 'error' });
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    setSettingsDraft((prev) => {
      if (!prev) {
        return prev;
      }

      if (prev.logoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.logoUrl);
      }

      return {
        ...prev,
        logoUrl: nextUrl
      };
    });
  };

  const handleCancelSettings = () => {
    if (!organization) {
      return;
    }

    if (settingsDraft?.logoUrl?.startsWith('blob:') && settingsDraft.logoUrl !== organization.logoUrl) {
      URL.revokeObjectURL(settingsDraft.logoUrl);
    }

    setSettingsTouched({ name: false, link: false });
    setSettingsDraft({
      name: organization.name,
      description: organization.description,
      link: organization.link,
      logoUrl: organization.logoUrl
    });
  };

  const handleSaveSettings = async () => {
    if (!organization || !settingsDraft) {
      return;
    }

    setSettingsTouched({ name: true, link: true });

    if (settingsFormInvalid || !hasSettingsChanges) {
      return;
    }

    setSettingsSubmitting(true);

    try {
      await projectsApi.updateOrganization(organization.id, {
        name: settingsDraft.name.trim(),
        description: settingsDraft.description,
        link: settingsDraft.link.trim(),
        logoUrl: settingsDraft.logoUrl
      });

      await loadOrganization(organization.id, Number(userId));
      setSettingsTouched({ name: false, link: false });
      setSnackbar({ message: 'Изменения сохранены', type: 'success' });
    } catch (error) {
      if (error?.code === 'ORGANIZATION_NAME_CONFLICT') {
        setSnackbar({ message: 'Организация с таким названием существует', type: 'error' });
      } else {
        setSnackbar({ message: 'Возникла непредвиденная ошибка. Попробуйте позже', type: 'error' });
      }
    } finally {
      setSettingsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="project-page">
        <Header />
        <div className="project-page__loader">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!organization || !settingsDraft) {
    return null;
  }

  const description = organization.description || '';
  const isLongDescription = description.length > 1000;
  const shownDescription = isLongDescription && !showFullDescription ? `${description.slice(0, 1000)}...` : description;

  return (
    <div className="project-page organization-page">
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar({ message: '', type: 'success' })} />

      <main className="project-page__content">
        <section className="project-page__info section-card">
          <div className="project-page__title-row">
            <div className="project-page__title-wrap">
              <h1 className="project-page__title">{organization.name}</h1>
            </div>
            <span className="project-page__role-tag">{PROJECT_MEMBER_ROLE_LABELS[organization.viewerRole]}</span>
          </div>

          <img className="organization-page__logo" src={organization.logoUrl} alt={`Логотип ${organization.name}`} />

          {description && (
            <p className="project-page__description">
              <span className="project-page__description-label">Описание организации: </span>
              <span>{shownDescription}</span>
              {isLongDescription && (
                <button className="project-page__description-toggle" type="button" onClick={() => setShowFullDescription((prev) => !prev)}>
                  {showFullDescription ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {organization.link && (
            <a className="project-page__repository" href={organization.link} target="_blank" rel="noreferrer">
              {truncateText(organization.link, 100)}
            </a>
          )}

          <div className="project-page__metrics">
            <div className="project-page__metric-item">
              <img src={participantsCountIcon} alt="Участники" />
              <span>Участников: {organization.participants.length}</span>
            </div>
            <div className="project-page__metric-item">
              <img src={projectsCountIcon} alt="Проекты" />
              <span>Проектов: {organization.projects.length}</span>
            </div>
          </div>
        </section>

        <EntityTabs tabs={availableTabs} activeKey={activeTab} onChange={setActiveTab} />

        {activeTab === 'projects' && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                <span className="project-page__participants-count">Проекты ({projectsSource.length})</span>
              </div>

              <div className="project-page__controls-right">
                <label className="project-page__search-field">
                  <SearchIcon />
                  <input
                    type="text"
                    placeholder="Поиск"
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value.slice(0, 120))}
                  />
                </label>

                {isOwner && (
                  <button className="project-page__action-button project-page__action-button--success" type="button" onClick={() => setCreateProjectOpen(true)}>
                    Создать проект
                  </button>
                )}
              </div>
            </div>

            <section className="section-card project-page__table-section">
              <div className="project-page__table-row project-page__table-row--head organization-page__projects-row">
                <span>Название</span>
                <span>Количество задач</span>
                <span>Участники</span>
                <span>Роль</span>
              </div>

              {visibleProjects.map((project) => (
                <div
                  key={project.id}
                  className="project-page__table-row organization-page__projects-row"
                  onClick={() => navigate(ROUTES.projectById.replace(':projectId', project.id))}
                  role="presentation"
                >
                  <span className="project-page__task-name" title={project.name}>{truncateText(project.name, 55)}</span>
                  <span className="organization-page__project-tasks">{project.activeTasksCount}</span>
                  <span className="project-page__assignees">
                    {project.participants.slice(0, 6).map((participant) => (
                      <span key={participant.id} className="project-page__assignee-avatar" title={participant.fullName}>
                        {participant.avatar ? <img src={participant.avatar} alt={participant.fullName} /> : <AvatarIcon />}
                      </span>
                    ))}
                    {project.participants.length > 6 && <span className="project-page__assignee-more">+{project.participants.length - 6}</span>}
                  </span>
                  <span className="project-page__participant-role">{PROJECT_MEMBER_ROLE_LABELS[project.viewerRole]}</span>
                </div>
              ))}

              {visibleProjects.length === 0 && <p className="project-page__list-empty">Проекты не найдены</p>}
              {hasMoreProjects && <div ref={projectsSentinelRef} className="project-page__sentinel" />}
            </section>
          </>
        )}

        {activeTab === 'participants' && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                {isOwner ? (
                  <div className="project-page__mode-switch organization-page__participants-switch">
                    <span className={`project-page__mode-thumb ${participantsMode === 'requests' ? 'project-page__mode-thumb--mine' : ''}`} />
                    <button
                      type="button"
                      className={`project-page__mode-button ${participantsMode === 'members' ? 'project-page__mode-button--active' : ''}`}
                      onClick={() => setParticipantsMode('members')}
                    >
                      Участники ({organization.participants.length})
                    </button>
                    <button
                      type="button"
                      className={`project-page__mode-button ${participantsMode === 'requests' ? 'project-page__mode-button--active' : ''}`}
                      onClick={() => setParticipantsMode('requests')}
                    >
                      Заявки ({organization.joinRequests.length})
                    </button>
                  </div>
                ) : (
                  <span className="project-page__participants-count">Участники ({organization.participants.length})</span>
                )}
              </div>

              <div className="project-page__controls-right">
                {isOwner ? (
                  <button className="project-page__action-button project-page__action-button--primary" type="button" onClick={() => setInviteModalOpen(true)}>
                    Пригласить
                  </button>
                ) : (
                  <button className="project-page__action-button project-page__action-button--danger" type="button" onClick={() => setLeaveModalOpen(true)}>
                    Выйти из организации
                  </button>
                )}
              </div>
            </div>

            <section className="section-card project-page__participants-list">
              {isOwner && participantsMode === 'requests'
                ? visibleRequests.map((request) => (
                  <div key={request.id} className="project-page__participant-row">
                    <div className="project-page__participant-main">
                      <span className="project-page__participant-avatar">
                        {request.avatar ? <img src={request.avatar} alt={request.fullName} /> : <AvatarIcon />}
                      </span>
                      <span className="project-page__participant-meta">
                        <span className="project-page__participant-name">{request.fullName}</span>
                        <span className="project-page__participant-login">@{request.login}</span>
                      </span>
                    </div>

                    <div className="organization-page__request-actions">
                      <button
                        className="organization-page__request-button organization-page__request-button--reject"
                        type="button"
                        onClick={() => handleRejectRequest(request)}
                        aria-label={`Отклонить заявку @${request.login}`}
                      >
                        <CrossIcon />
                      </button>
                      <button
                        className="organization-page__request-button organization-page__request-button--accept"
                        type="button"
                        onClick={() => handleApproveRequest(request)}
                        aria-label={`Принять заявку @${request.login}`}
                      >
                        <CheckIcon />
                      </button>
                    </div>
                  </div>
                ))
                : visibleParticipants.map((participant) => (
                  <Link key={participant.id} className="project-page__participant-row" to={`${ROUTES.profile}/${participant.id}`}>
                    <div className="project-page__participant-main">
                      <span className="project-page__participant-avatar">
                        {participant.avatar ? <img src={participant.avatar} alt={participant.fullName} /> : <AvatarIcon />}
                      </span>
                      <span className="project-page__participant-meta">
                        <span className="project-page__participant-name">{participant.fullName}</span>
                        <span className="project-page__participant-login">@{participant.login}</span>
                      </span>
                    </div>
                    <span className="project-page__participant-role">{PROJECT_MEMBER_ROLE_LABELS[participant.role]}</span>
                  </Link>
                ))}

              {isOwner && participantsMode === 'requests' && visibleRequests.length === 0 && <p className="project-page__list-empty">Заявок пока нет</p>}
              {(!isOwner || participantsMode === 'members') && visibleParticipants.length === 0 && <p className="project-page__list-empty">Участники не найдены</p>}

              {isOwner && participantsMode === 'requests' && hasMoreRequests && <div ref={requestsSentinelRef} className="project-page__sentinel" />}
              {(!isOwner || participantsMode === 'members') && hasMoreParticipants && <div ref={participantsSentinelRef} className="project-page__sentinel" />}
            </section>
          </>
        )}

        {activeTab === 'settings' && isOwner && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                <span className="project-page__participants-count">Настройки</span>
              </div>

              <div className="project-page__controls-right">
                <button className="project-page__action-button project-page__action-button--danger" type="button" onClick={() => setDeleteModalOpen(true)}>
                  Удалить организацию
                </button>
              </div>
            </div>

            <section className="section-card project-page__settings">
              <div className="project-page__settings-field">
                <label>Название</label>
                <input
                  className={`project-page__settings-input ${settingsTouched.name && settingsNameError ? 'project-page__settings-input--error' : ''}`}
                  value={settingsDraft.name}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, name: event.target.value.slice(0, 100) }))}
                  onBlur={() => setSettingsTouched((prev) => ({ ...prev, name: true }))}
                />
                {settingsTouched.name && settingsNameError && <p className="project-page__settings-error">{settingsNameError}</p>}
              </div>

              <div className="project-page__settings-field">
                <label>Описание</label>
                <textarea
                  className="project-page__settings-input project-page__settings-textarea"
                  value={settingsDraft.description}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, description: event.target.value.slice(0, 3000) }))}
                />
              </div>

              <div className="project-page__settings-field">
                <label>Ссылка</label>
                <input
                  className={`project-page__settings-input ${settingsTouched.link && settingsLinkError ? 'project-page__settings-input--error' : ''}`}
                  value={settingsDraft.link}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, link: event.target.value.slice(0, 500) }))}
                  onBlur={() => setSettingsTouched((prev) => ({ ...prev, link: true }))}
                />
                {settingsTouched.link && settingsLinkError && <p className="project-page__settings-error">{settingsLinkError}</p>}
              </div>

              <div className="project-page__settings-field">
                <label>Логотип</label>
                <div className="organization-page__settings-logo-wrap">
                  <img className="organization-page__settings-logo" src={settingsDraft.logoUrl} alt="Логотип организации" />
                  <button className="organization-page__settings-logo-upload" type="button" onClick={() => logoInputRef.current?.click()}>
                    <img src={uploadIcon} alt="" />
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                </div>
              </div>

              {hasSettingsChanges && (
                <div className="project-page__settings-actions">
                  <button
                    className="project-page__settings-action project-page__settings-action--save"
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={isSettingsSubmitting || settingsFormInvalid}
                  >
                    <CheckIcon />
                  </button>
                  <button className="project-page__settings-action project-page__settings-action--cancel" type="button" onClick={handleCancelSettings} disabled={isSettingsSubmitting}>
                    <CrossIcon />
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <ProjectCreateModal
        isOpen={isCreateProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isCreateProjectSubmitting}
      />

      <InviteLinkModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onGenerate={handleInviteGenerate}
        onCopySuccess={() => setSnackbar({ message: 'Ссылка скопирована', type: 'success' })}
        isSubmitting={isInviteSubmitting}
      />

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Удалить организацию"
        description="Данное действие необратимо. Организация будет удалена без возможности восстановления."
        confirmLabel="Удалить"
        onCancel={() => !isDeleteSubmitting && setDeleteModalOpen(false)}
        onConfirm={handleDeleteOrganization}
        isSubmitting={isDeleteSubmitting}
        isDeleteAction
      />

      <ConfirmActionModal
        isOpen={isLeaveModalOpen}
        title="Выйти из организации"
        description="После выхода из организации доступ к её проектам может быть ограничен."
        confirmLabel="Выйти"
        onCancel={() => !isLeaveSubmitting && setLeaveModalOpen(false)}
        onConfirm={handleLeaveOrganization}
        isSubmitting={isLeaveSubmitting}
        isDeleteAction
      />
    </div>
  );
};

export default OrganizationPage;

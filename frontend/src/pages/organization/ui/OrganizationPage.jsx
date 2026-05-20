import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import participantsCountIcon from '@/shared/assets/participants-count-icon.svg';
import projectsCountIcon from '@/shared/assets/projects-count-icon.svg';
import uploadIcon from '@/shared/assets/upload-icon.svg';
import {
  projectsApi,
  useApproveOrganizationJoinRequestMutation,
  useCreateProjectMutation,
  useDeleteOrganizationMutation,
  useGetOrganizationByIdQuery,
  useLeaveOrganizationMutation,
  useRejectOrganizationJoinRequestMutation,
  useUpdateOrganizationMutation
} from '@/entities/project';
import ConfirmActionModal from '@/shared/ui/confirm-action-modal';
import EntityTabs from '@/shared/ui/entity-tabs';
import { AvatarIcon, CheckIcon, CrossIcon, SearchIcon } from '@/shared/ui/icons';
import { InviteLinkModal } from '@/features/generate-invite-link';
import { ProjectCreateModal } from '@/features/create-project';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import { ACCESS_ERROR_CODE, PROJECT_MEMBER_ROLE, PROJECT_MEMBER_ROLE_LABELS } from '@/entities/project';
import { NOTIFICATION_COMPLETION_ACTION, NOTIFICATION_TARGET_KIND, useCompleteNotificationMutation } from '@/entities/notification';
import { ROUTES } from '@/shared/config/routes';
import { sortParticipants, truncateText } from '@/entities/project';
import { validateOrganizationName, validateOrganizationUrl } from '@/entities/organization';
import { useDebouncedValue } from '@/shared/lib/hooks';
import { useSnackbar } from '@/shared/lib/hooks';
import './OrganizationPage.css';

const tabs = {
  projects: 'Проекты',
  participants: 'Участники',
  settings: 'Настройки'
};

const OrganizationPage = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const logoInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('projects');
  const [participantsMode, setParticipantsMode] = useState('members');
  const [projectSearch, setProjectSearch] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviteSubmitting, setInviteSubmitting] = useState(false);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);

  const [isCreateProjectOpen, setCreateProjectOpen] = useState(false);

  const [requestActionUserId, setRequestActionUserId] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsTouched, setSettingsTouched] = useState({ name: false, link: false });
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const debouncedProjectSearch = useDebouncedValue(projectSearch, 300);
  const numericOrganizationId = Number(organizationId);
  const {
    data: organization,
    error: organizationError,
    isLoading,
    refetch: refetchOrganization
  } = useGetOrganizationByIdQuery(numericOrganizationId, {
    refetchOnMountOrArgChange: 30
  });
  const [createProject, { isLoading: isCreateProjectSubmitting }] = useCreateProjectMutation();
  const [leaveOrganization, { isLoading: isLeaveSubmitting }] = useLeaveOrganizationMutation();
  const [deleteOrganization, { isLoading: isDeleteSubmitting }] = useDeleteOrganizationMutation();
  const [updateOrganization, { isLoading: isSettingsSubmitting }] = useUpdateOrganizationMutation();
  const [approveOrganizationJoinRequest] = useApproveOrganizationJoinRequestMutation();
  const [rejectOrganizationJoinRequest] = useRejectOrganizationJoinRequestMutation();
  const [completeNotification] = useCompleteNotificationMutation();

  useEffect(() => {
    if (!organizationError) {
      return;
    }

    if (organizationError?.status === 403 && organizationError?.code === ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION) {
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Необходимо присоединиться к организации для просмотра'
        }
      });
      return;
    }

    navigate(ROUTES.projects, { replace: true });
  }, [navigate, organizationError]);

  useEffect(() => {
    if (!organization) {
      return;
    }

    queueMicrotask(() => {
      setSettingsDraft({
        name: organization.name,
        description: organization.description,
        link: organization.link,
        logoUrl: organization.logoUrl,
        logoFile: null
      });
      setSettingsTouched({ name: false, link: false });
    });
  }, [organization]);

  const projectsList = useMemo(() => {
    const normalizedSearch = debouncedProjectSearch.trim().toLowerCase();

    return (organization?.projects || []).filter((project) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        (project.name || '').toLowerCase().includes(normalizedSearch) ||
        (project.description || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [debouncedProjectSearch, organization?.projects]);
  const projectsTotal = projectsList.length;

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      showSnackbar(location.state.snackbarMessage, location.state.snackbarType || 'success');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, showSnackbar]);

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

  const participantsSource = useMemo(() => sortParticipants(organization?.participants || []), [organization?.participants]);

  const requestsSource = useMemo(
    () =>
      [...(organization?.joinRequests || [])].sort((left, right) =>
        String(left.fullName ?? '').localeCompare(String(right.fullName ?? ''), 'ru', { sensitivity: 'base' })
      ),
    [organization?.joinRequests]
  );

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
      !!settingsDraft.logoFile
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
      showSnackbar('Не удалось сформировать ссылку. Попробуйте позже', 'error');
      return null;
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCreateProject = async (payload) => {
    if (!organization) {
      return;
    }

    try {
      const result = await createProject({ ...payload, organizationId: organization.id }).unwrap();
      const projectId = result?.projectId;

      if (projectId) {
        setCreateProjectOpen(false);
        navigate(ROUTES.projectById.replace(':projectId', projectId), { replace: true });
      }
    } catch (error) {
      if (error?.code === 'PROJECT_NAME_CONFLICT') {
        showSnackbar('Проект с таким названием уже существует', 'error');
      } else {
        showSnackbar('Не удалось создать проект. Попробуйте позже', 'error');
      }
    }
  };

  const handleLeaveOrganization = async () => {
    if (!organization) {
      return;
    }

    try {
      await leaveOrganization(organization.id).unwrap();
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Вы вышли из организации',
          snackbarType: 'success'
        }
      });
    } catch {
      showSnackbar('Не удалось выйти из организации', 'error');
    } finally {
      setLeaveModalOpen(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organization) {
      return;
    }

    try {
      await deleteOrganization(organization.id).unwrap();
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Организация удалена',
          snackbarType: 'success'
        }
      });
    } catch {
      showSnackbar('Не удалось удалить организацию', 'error');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!organization) {
      return;
    }

    setRequestActionUserId(request.userId);

    try {
      await rejectOrganizationJoinRequest({ organizationId: organization.id, userId: request.userId }).unwrap();
      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.RESOLVE_ORGANIZATION_JOIN_REQUEST,
        target: {
          kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
          organizationId: organization.id,
          userId: request.userId
        }
      });
      await refetchOrganization().unwrap();
      showSnackbar(`Вы отклонили заявку пользователя @${request.login}`, 'error');
    } catch {
      showSnackbar('Не удалось отклонить заявку', 'error');
    } finally {
      setRequestActionUserId(null);
    }
  };

  const handleApproveRequest = async (request) => {
    if (!organization) {
      return;
    }

    setRequestActionUserId(request.userId);

    try {
      await approveOrganizationJoinRequest({ organizationId: organization.id, userId: request.userId }).unwrap();
      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.RESOLVE_ORGANIZATION_JOIN_REQUEST,
        target: {
          kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
          organizationId: organization.id,
          userId: request.userId
        }
      });
      await refetchOrganization().unwrap();
      showSnackbar(`Вы приняли заявку пользователя @${request.login}`, 'success');
    } catch {
      showSnackbar('Не удалось принять заявку', 'error');
    } finally {
      setRequestActionUserId(null);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);

    setSettingsDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        logoUrl: nextUrl,
        logoFile: file,
      };
    });
  };

  const handleCancelSettings = () => {
    if (!organization) {
      return;
    }

    setSettingsTouched({ name: false, link: false });

    setSettingsDraft({
      name: organization.name,
      description: organization.description,
      link: organization.link,
      logoUrl: organization.logoUrl,
      logoFile: null
    });
  };

  const handleSaveSettings = async () => {
    if (!organization || !settingsDraft) return;

    setSettingsTouched({ name: true, link: true });

    if (settingsFormInvalid || !hasSettingsChanges) return;

    try {
      const payload = {};

      if (settingsDraft.name.trim() !== organization.name) {
        payload.name = settingsDraft.name.trim();
      }

      if (settingsDraft.description !== organization.description) {
        payload.description = settingsDraft.description;
      }
      if (settingsDraft.link.trim() !== organization.link) {
        payload.link = settingsDraft.link.trim();
      }
      if (settingsDraft.logoFile) {
        payload.logoFile = settingsDraft.logoFile;
      }

      await updateOrganization({ organizationId: organization.id, payload }).unwrap();
      await refetchOrganization().unwrap();

      setSettingsDraft(prev => ({ ...prev, logoFile: null }));

      setSettingsTouched({ name: false, link: false });
      showSnackbar('Изменения сохранены', 'success');
    } catch (error) {
      if (error?.code === 'ORGANIZATION_NAME_CONFLICT') {
        showSnackbar('Организация с таким названием существует', 'error');
      } else {
        showSnackbar('Возникла непредвиденная ошибка. Попробуйте позже', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="project-page">
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
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

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
                <span className="project-page__participants-count">Проекты ({projectsTotal})</span>
              </div>

              <div className="project-page__controls-right">
                <label className="project-page__search-field">
                  <SearchIcon />
                  <input
                    type="search"
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

              {projectsList.map((project) => (
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

              {projectsList.length === 0 && <p className="project-page__list-empty">Проекты не найдены</p>}
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
                ? requestsSource.map((request) => (
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
                        disabled={requestActionUserId === request.userId}
                        aria-label={`Отклонить заявку @${request.login}`}
                      >
                        <CrossIcon />
                      </button>
                      <button
                        className="organization-page__request-button organization-page__request-button--accept"
                        type="button"
                        onClick={() => handleApproveRequest(request)}
                        disabled={requestActionUserId === request.userId}
                        aria-label={`Принять заявку @${request.login}`}
                      >
                        <CheckIcon />
                      </button>
                    </div>
                  </div>
                ))
                : participantsSource.map((participant) => (
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

              {isOwner && participantsMode === 'requests' && requestsSource.length === 0 && <p className="project-page__list-empty">Заявок пока нет</p>}
              {(!isOwner || participantsMode === 'members') && participantsSource.length === 0 && <p className="project-page__list-empty">Участники не найдены</p>}
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
        onCopySuccess={() => showSnackbar('Ссылка скопирована', 'success')}
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

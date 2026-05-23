import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  useUpdateOrganizationMutation,
} from '@/entities/project';
import ConfirmActionModal from '@/shared/ui/confirm-action-modal';
import EntityTabs from '@/shared/ui/entity-tabs';
import { AvatarIcon, CheckIcon, CrossIcon, SearchIcon } from '@/shared/ui/icons';
import { InviteLinkModal } from '@/features/generate-invite-link';
import { ProjectCreateModal } from '@/features/create-project';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import { ACCESS_ERROR_CODE, PROJECT_MEMBER_ROLE, PROJECT_MEMBER_ROLE_LABELS } from '@/entities/project';
import {
  NOTIFICATION_COMPLETION_ACTION,
  NOTIFICATION_TARGET_KIND,
  useCompleteNotificationMutation,
} from '@/entities/notification';
import { ROUTES } from '@/shared/config/routes';
import { sortParticipants, truncateText } from '@/entities/project';
import { organizationSettingsFormSchema } from '@/entities/organization';
import { useDebouncedValue } from '@/shared/lib/hooks';
import { useSnackbar } from '@/shared/lib/hooks';
import organizationPageStyles from './OrganizationPage.module.scss';
import projectPageStyles from '../../project/ui/ProjectPage.module.scss';
type AccessErrorShape = {
  status?: number;
  code?: string;
  projectId?: string;
  projectPrivacy?: string;
};

const isAccessErrorShape = (value: unknown): value is AccessErrorShape => typeof value === 'object' && value !== null;

const tabs = {
  projects: 'Проекты',
  participants: 'Участники',
  settings: 'Настройки',
};

const getOrganizationSettingsDefaults = (organization: LegacyValue = null) => ({
  name: organization?.name || '',
  description: organization?.description || '',
  link: organization?.link || '',
  logoUrl: organization?.logoUrl || '',
  logoFile: null,
});

const OrganizationPage = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const logoInputRef = useRef<LegacyValue>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [participantsMode, setParticipantsMode] = useState('members');
  const [projectSearch, setProjectSearch] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviteSubmitting, setInviteSubmitting] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isCreateProjectOpen, setCreateProjectOpen] = useState(false);
  const [requestActionUserId, setRequestActionUserId] = useState<LegacyValue>(null);

  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    reset: resetSettings,
    setValue: setSettingsValue,
    formState: {
      errors: settingsErrors,
      isSubmitted: isSettingsSubmitted,
      isValid: isSettingsValid,
      touchedFields: settingsTouchedFields,
    },
    control: settingsControl,
  } = useForm<LegacyValue>({
    resolver: zodResolver(organizationSettingsFormSchema),
    defaultValues: getOrganizationSettingsDefaults(),
    mode: 'onChange',
  });

  const settingsDraft = useWatch({
    control: settingsControl,
  });

  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const debouncedProjectSearch = useDebouncedValue(projectSearch, 300);
  const numericOrganizationId = Number(organizationId);

  const {
    data: organization,
    error: organizationError,
    isLoading,
    refetch: refetchOrganization,
  } = useGetOrganizationByIdQuery(numericOrganizationId, {
    refetchOnMountOrArgChange: 30,
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

    const accessError = isAccessErrorShape(organizationError) ? organizationError : undefined;

    if (accessError?.status === 403 && accessError?.code === ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION) {
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Необходимо присоединиться к организации для просмотра',
        },
      });

      return;
    }

    navigate(ROUTES.projects, {
      replace: true,
    });
  }, [navigate, organizationError]);

  useEffect(() => {
    if (!organization) {
      return;
    }

    queueMicrotask(() => {
      resetSettings(getOrganizationSettingsDefaults(organization));
    });
  }, [organization, resetSettings]);

  const projectsList = useMemo(() => {
    const normalizedSearch = debouncedProjectSearch.trim().toLowerCase();

    return (organization?.projects || []).filter((project: LegacyValue) => {
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

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
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
      {
        key: 'projects',
        label: tabs.projects,
      },
      {
        key: 'participants',
        label: tabs.participants,
      },
    ];

    if (isOwner) {
      baseTabs.push({
        key: 'settings',
        label: tabs.settings,
      });
    }

    return baseTabs;
  }, [isOwner]);

  const participantsSource = useMemo(
    () => sortParticipants(organization?.participants || []),
    [organization?.participants]
  );

  const requestsSource = useMemo(
    () =>
      [...(organization?.joinRequests || [])].sort((left: LegacyValue, right: LegacyValue) =>
        String(left.fullName ?? '').localeCompare(String(right.fullName ?? ''), 'ru', {
          sensitivity: 'base',
        })
      ),
    [organization?.joinRequests]
  );

  const getSettingsError = (fieldName: string) => {
    if (!(settingsTouchedFields[fieldName] || isSettingsSubmitted)) {
      return '';
    }

    return String(settingsErrors[fieldName]?.message || '');
  };

  const settingsNameError = getSettingsError('name');
  const settingsLinkError = getSettingsError('link');

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

  const handleInviteGenerate = async (payload: LegacyValue) => {
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

  const handleCreateProject = async (payload: LegacyValue) => {
    if (!organization) {
      return;
    }

    try {
      const result = await createProject({
        ...payload,
        organizationId: organization.id,
      }).unwrap();

      const projectId = result?.projectId;

      if (projectId) {
        setCreateProjectOpen(false);

        navigate(ROUTES.projectById.replace(':projectId', projectId), {
          replace: true,
        });
      }
    } catch (error: LegacyValue) {
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
          snackbarType: 'success',
        },
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
          snackbarType: 'success',
        },
      });
    } catch {
      showSnackbar('Не удалось удалить организацию', 'error');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleRejectRequest = async (request: LegacyValue) => {
    if (!organization) {
      return;
    }

    setRequestActionUserId(request.userId);

    try {
      await rejectOrganizationJoinRequest({
        organizationId: organization.id,
        userId: request.userId,
      }).unwrap();

      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.RESOLVE_ORGANIZATION_JOIN_REQUEST,
        target: {
          kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
          organizationId: organization.id,
          userId: request.userId,
        },
      });

      await refetchOrganization().unwrap();
      showSnackbar(`Вы отклонили заявку пользователя @${request.login}`, 'error');
    } catch {
      showSnackbar('Не удалось отклонить заявку', 'error');
    } finally {
      setRequestActionUserId(null);
    }
  };

  const handleApproveRequest = async (request: LegacyValue) => {
    if (!organization) {
      return;
    }

    setRequestActionUserId(request.userId);

    try {
      await approveOrganizationJoinRequest({
        organizationId: organization.id,
        userId: request.userId,
      }).unwrap();

      completeNotification({
        action: NOTIFICATION_COMPLETION_ACTION.RESOLVE_ORGANIZATION_JOIN_REQUEST,
        target: {
          kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
          organizationId: organization.id,
          userId: request.userId,
        },
      });

      await refetchOrganization().unwrap();
      showSnackbar(`Вы приняли заявку пользователя @${request.login}`, 'success');
    } catch {
      showSnackbar('Не удалось принять заявку', 'error');
    } finally {
      setRequestActionUserId(null);
    }
  };

  const handleLogoUpload = (event: LegacyValue) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);

    setSettingsValue('logoUrl', nextUrl, {
      shouldDirty: true,
    });

    setSettingsValue('logoFile', file, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleCancelSettings = () => {
    if (!organization) {
      return;
    }

    resetSettings(getOrganizationSettingsDefaults(organization));
  };

  const saveSettings = async (settingsDraft: LegacyValue) => {
    if (!organization || !settingsDraft) return;
    if (!hasSettingsChanges) return;

    try {
      const payload: LegacyValue = {};

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

      await updateOrganization({
        organizationId: organization.id,
        payload,
      }).unwrap();

      const fullOrganization = await refetchOrganization().unwrap();
      resetSettings(getOrganizationSettingsDefaults(fullOrganization));
      showSnackbar('Изменения сохранены', 'success');
    } catch (error: LegacyValue) {
      if (error?.code === 'ORGANIZATION_NAME_CONFLICT') {
        showSnackbar('Организация с таким названием существует', 'error');
      } else {
        showSnackbar('Возникла непредвиденная ошибка. Попробуйте позже', 'error');
      }
    }
  };

  const handleSaveSettings = handleSettingsSubmit(saveSettings);

  if (isLoading) {
    return (
      <div className={projectPageStyles.root}>
        <div className={projectPageStyles.loader}>
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
    <div className={projectPageStyles.root}>
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className={projectPageStyles.content}>
        <section className={[projectPageStyles.info, projectPageStyles.sectionCard].join(' ')}>
          <div className={projectPageStyles.titleRow}>
            <div className={projectPageStyles.titleWrap}>
              <h1 className={projectPageStyles.title}>{organization.name}</h1>
            </div>
            <span className={projectPageStyles.roleTag}>{PROJECT_MEMBER_ROLE_LABELS[organization.viewerRole]}</span>
          </div>

          <img
            className={organizationPageStyles.logo}
            src={organization.logoUrl}
            alt={`Логотип ${organization.name}`}
          />

          {description && (
            <p className={projectPageStyles.description}>
              <span className={projectPageStyles.descriptionLabel}>Описание организации: </span>
              <span>{shownDescription}</span>
              {isLongDescription && (
                <button
                  className={projectPageStyles.descriptionToggle}
                  type="button"
                  onClick={() => setShowFullDescription((prev: LegacyValue) => !prev)}
                >
                  {showFullDescription ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {organization.link && (
            <a className={projectPageStyles.repository} href={organization.link} target="_blank" rel="noreferrer">
              {truncateText(organization.link, 100)}
            </a>
          )}

          <div className={projectPageStyles.metrics}>
            <div className={projectPageStyles.metricItem}>
              <img src={participantsCountIcon} alt="Участники" />
              <span>Участников: {organization.participants.length}</span>
            </div>
            <div className={projectPageStyles.metricItem}>
              <img src={projectsCountIcon} alt="Проекты" />
              <span>Проектов: {organization.projects.length}</span>
            </div>
          </div>
        </section>

        <EntityTabs tabs={availableTabs} activeKey={activeTab} onChange={setActiveTab} />

        {activeTab === 'projects' && (
          <>
            <div className={projectPageStyles.controls}>
              <div className={projectPageStyles.controlsLeft}>
                <span className={projectPageStyles.participantsCount}>Проекты ({projectsTotal})</span>
              </div>

              <div className={projectPageStyles.controlsRight}>
                <label className={projectPageStyles.searchField}>
                  <SearchIcon />
                  <input
                    type="search"
                    placeholder="Поиск"
                    value={projectSearch}
                    onChange={(event: LegacyValue) => setProjectSearch(event.target.value.slice(0, 120))}
                  />
                </label>

                {isOwner && (
                  <button
                    className={[projectPageStyles.actionButton, projectPageStyles.isSuccess].join(' ')}
                    type="button"
                    onClick={() => setCreateProjectOpen(true)}
                  >
                    Создать проект
                  </button>
                )}
              </div>
            </div>

            <section className={[projectPageStyles.sectionCard, projectPageStyles.tableSection].join(' ')}>
              <div className={[projectPageStyles.tableRow, projectPageStyles.isHead].join(' ')}>
                <span>Название</span>
                <span>Количество задач</span>
                <span>Участники</span>
                <span>Роль</span>
              </div>

              {projectsList.map((project: LegacyValue) => (
                <div
                  key={project.id}
                  className={projectPageStyles.tableRow}
                  onClick={() => navigate(ROUTES.projectById.replace(':projectId', project.id))}
                  role="presentation"
                >
                  <span className={projectPageStyles.taskName} title={project.name}>
                    {truncateText(project.name, 55)}
                  </span>
                  <span className={organizationPageStyles.projectTasks}>{project.activeTasksCount}</span>
                  <span className={projectPageStyles.assignees}>
                    {project.participants.slice(0, 6).map((participant: LegacyValue) => (
                      <span
                        key={participant.id}
                        className={projectPageStyles.assigneeAvatar}
                        title={participant.fullName}
                      >
                        {participant.avatar ? (
                          <img src={participant.avatar} alt={participant.fullName} />
                        ) : (
                          <AvatarIcon />
                        )}
                      </span>
                    ))}
                    {project.participants.length > 6 && (
                      <span className={projectPageStyles.assigneeMore}>+{project.participants.length - 6}</span>
                    )}
                  </span>
                  <span className={projectPageStyles.participantRole}>
                    {PROJECT_MEMBER_ROLE_LABELS[project.viewerRole]}
                  </span>
                </div>
              ))}

              {projectsList.length === 0 && <p className={projectPageStyles.listEmpty}>Проекты не найдены</p>}
            </section>
          </>
        )}

        {activeTab === 'participants' && (
          <>
            <div className={projectPageStyles.controls}>
              <div className={projectPageStyles.controlsLeft}>
                {isOwner ? (
                  <div className={[projectPageStyles.modeSwitch, organizationPageStyles.participantsSwitch].join(' ')}>
                    <span
                      className={[
                        projectPageStyles.modeThumb,
                        participantsMode === 'requests' ? projectPageStyles.isMine : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                    <button
                      type="button"
                      className={[
                        projectPageStyles.modeButton,
                        participantsMode === 'members' ? projectPageStyles.isActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setParticipantsMode('members')}
                    >
                      Участники ({organization.participants.length})
                    </button>
                    <button
                      type="button"
                      className={[
                        projectPageStyles.modeButton,
                        participantsMode === 'requests' ? projectPageStyles.isActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setParticipantsMode('requests')}
                    >
                      Заявки ({organization.joinRequests.length})
                    </button>
                  </div>
                ) : (
                  <span className={projectPageStyles.participantsCount}>
                    Участники ({organization.participants.length})
                  </span>
                )}
              </div>

              <div className={projectPageStyles.controlsRight}>
                {isOwner ? (
                  <button
                    className={[projectPageStyles.actionButton, projectPageStyles.isPrimary].join(' ')}
                    type="button"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    Пригласить
                  </button>
                ) : (
                  <button
                    className={[projectPageStyles.actionButton, projectPageStyles.isDanger].join(' ')}
                    type="button"
                    onClick={() => setLeaveModalOpen(true)}
                  >
                    Выйти из организации
                  </button>
                )}
              </div>
            </div>

            <section className={[projectPageStyles.sectionCard, projectPageStyles.participantsList].join(' ')}>
              {isOwner && participantsMode === 'requests'
                ? requestsSource.map((request: LegacyValue) => (
                    <div key={request.id} className={projectPageStyles.participantRow}>
                      <div className={projectPageStyles.participantMain}>
                        <span className={projectPageStyles.participantAvatar}>
                          {request.avatar ? <img src={request.avatar} alt={request.fullName} /> : <AvatarIcon />}
                        </span>
                        <span className={projectPageStyles.participantMeta}>
                          <span className={projectPageStyles.participantName}>{request.fullName}</span>
                          <span className={projectPageStyles.participantLogin}>@{request.login}</span>
                        </span>
                      </div>

                      <div className={organizationPageStyles.requestActions}>
                        <button
                          className={[organizationPageStyles.requestButton, organizationPageStyles.isReject].join(' ')}
                          type="button"
                          onClick={() => handleRejectRequest(request)}
                          disabled={requestActionUserId === request.userId}
                          aria-label={`Отклонить заявку @${request.login}`}
                        >
                          <CrossIcon />
                        </button>
                        <button
                          className={[organizationPageStyles.requestButton, organizationPageStyles.isAccept].join(' ')}
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
                : participantsSource.map((participant: LegacyValue) => (
                    <Link
                      key={participant.id}
                      className={projectPageStyles.participantRow}
                      to={`${ROUTES.profile}/${participant.id}`}
                    >
                      <div className={projectPageStyles.participantMain}>
                        <span className={projectPageStyles.participantAvatar}>
                          {participant.avatar ? (
                            <img src={participant.avatar} alt={participant.fullName} />
                          ) : (
                            <AvatarIcon />
                          )}
                        </span>
                        <span className={projectPageStyles.participantMeta}>
                          <span className={projectPageStyles.participantName}>{participant.fullName}</span>
                          <span className={projectPageStyles.participantLogin}>@{participant.login}</span>
                        </span>
                      </div>
                      <span className={projectPageStyles.participantRole}>
                        {PROJECT_MEMBER_ROLE_LABELS[participant.role]}
                      </span>
                    </Link>
                  ))}

              {isOwner && participantsMode === 'requests' && requestsSource.length === 0 && (
                <p className={projectPageStyles.listEmpty}>Заявок пока нет</p>
              )}
              {(!isOwner || participantsMode === 'members') && participantsSource.length === 0 && (
                <p className={projectPageStyles.listEmpty}>Участники не найдены</p>
              )}
            </section>
          </>
        )}

        {activeTab === 'settings' && isOwner && (
          <>
            <div className={projectPageStyles.controls}>
              <div className={projectPageStyles.controlsLeft}>
                <span className={projectPageStyles.participantsCount}>Настройки</span>
              </div>

              <div className={projectPageStyles.controlsRight}>
                <button
                  className={[projectPageStyles.actionButton, projectPageStyles.isDanger].join(' ')}
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Удалить организацию
                </button>
              </div>
            </div>

            <form
              className={[projectPageStyles.sectionCard, projectPageStyles.settings].join(' ')}
              onSubmit={handleSaveSettings}
            >
              <div className={projectPageStyles.settingsField}>
                <label>Название</label>
                <input
                  className={[
                    projectPageStyles.settingsInput,
                    settingsNameError ? projectPageStyles.settingsInputError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  maxLength={100}
                  {...registerSettings('name')}
                />
                {settingsNameError && <p className={projectPageStyles.settingsError}>{settingsNameError}</p>}
              </div>

              <div className={projectPageStyles.settingsField}>
                <label>Описание</label>
                <textarea
                  className={[projectPageStyles.settingsInput, projectPageStyles.settingsTextarea].join(' ')}
                  maxLength={3000}
                  {...registerSettings('description')}
                />
              </div>

              <div className={projectPageStyles.settingsField}>
                <label>Ссылка</label>
                <input
                  className={[
                    projectPageStyles.settingsInput,
                    settingsLinkError ? projectPageStyles.settingsInputError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  maxLength={500}
                  {...registerSettings('link')}
                />
                {settingsLinkError && <p className={projectPageStyles.settingsError}>{settingsLinkError}</p>}
              </div>

              <div className={projectPageStyles.settingsField}>
                <label>Логотип</label>
                <div className={organizationPageStyles.settingsLogoWrap}>
                  <img
                    className={organizationPageStyles.settingsLogo}
                    src={settingsDraft.logoUrl}
                    alt="Логотип организации"
                  />
                  <button
                    className={organizationPageStyles.settingsLogoUpload}
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <img src={uploadIcon} alt="" />
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                </div>
              </div>

              {hasSettingsChanges && (
                <div className={projectPageStyles.settingsActions}>
                  <button
                    className={[projectPageStyles.settingsAction, projectPageStyles.isSave].join(' ')}
                    type="submit"
                    disabled={isSettingsSubmitting || !isSettingsValid}
                  >
                    <CheckIcon />
                  </button>
                  <button
                    className={[projectPageStyles.settingsAction, projectPageStyles.isCancel].join(' ')}
                    type="button"
                    onClick={handleCancelSettings}
                    disabled={isSettingsSubmitting}
                  >
                    <CrossIcon />
                  </button>
                </div>
              )}
            </form>
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

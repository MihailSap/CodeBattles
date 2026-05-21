import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { profileSettingsApi } from '@/features/update-profile-settings';
import { profilePasswordFormSchema } from '@/entities/session';
import { useAuth } from '@/entities/session';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { useSnackbar } from '@/shared/lib/hooks';
import Snackbar from '@/shared/ui/snackbar';
import { CrossIcon, RefreshCycleIcon } from '@/shared/ui/icons';
import ModalShell from '@/shared/ui/modal-shell';
import './ProfileSettingsModal.css';

const initialPasswordForm = {
  currentPassword: '',
  password: '',
  confirmPassword: '',
};

const initialNotifications = {
  reviewAssignments: true,
  newComments: true,
  achievements: true,
};

const initialLinkedAccounts = {
  githubLogin: '',
  gitlabLogin: '',
};

const ProfileSettingsModal = ({ isOpen = false, onClose }) => {
  const { userId } = useAuth();
  const {
    register,
    handleSubmit,
    reset: resetPasswordForm,
    formState: {
      errors: passwordErrors,
      isSubmitted: isPasswordSubmitted,
      isValid: isPasswordFormValid,
      touchedFields: passwordTouchedFields,
    },
  } = useForm({
    resolver: zodResolver(profilePasswordFormSchema),
    defaultValues: initialPasswordForm,
    mode: 'onChange',
  });
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState(initialLinkedAccounts);
  const [isLinkedAccountsLoading, setIsLinkedAccountsLoading] = useState(false);
  const [isLinkActionLoading, setIsLinkActionLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    const loadSettings = async () => {
      setLoadError('');
      setIsLinkedAccountsLoading(true);

      try {
        const [notificationSettings, linkedAccountsState] = await Promise.all([
          profileSettingsApi.getNotificationSettings(),
          profileSettingsApi.getLinkedAccounts(),
        ]);

        if (isCancelled) {
          return;
        }

        setNotifications({
          ...initialNotifications,
          ...notificationSettings,
        });

        setLinkedAccounts({
          ...initialLinkedAccounts,
          ...linkedAccountsState,
        });
      } catch {
        if (!isCancelled) {
          setLoadError('Не удалось загрузить настройки профиля');
        }
      } finally {
        if (!isCancelled) {
          setIsLinkedAccountsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, userId]);

  const getPasswordFieldError = (name) => {
    if (!(passwordTouchedFields[name] || isPasswordSubmitted)) {
      return '';
    }

    return passwordErrors[name]?.message || '';
  };

  const submitPassword = async (passwordForm) => {
    setIsPasswordSubmitting(true);

    try {
      await profileSettingsApi.updatePassword(passwordForm.currentPassword, passwordForm.password);
      showSnackbar('Пароль успешно обновлён', 'success');
      resetPasswordForm(initialPasswordForm);
    } catch (error) {
      showSnackbar(error?.message || 'Не удалось обновить пароль', 'error');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleNotificationChange = async (key) => {
    const nextSettings = {
      ...notifications,
      [key]: !notifications[key],
    };

    setNotifications(nextSettings);
    setIsNotificationsSaving(true);

    try {
      await profileSettingsApi.updateNotificationSettings(nextSettings);
      showSnackbar('Настройки уведомлений сохранены', 'success');
    } catch {
      setNotifications(notifications);
      showSnackbar('Не удалось сохранить настройки уведомлений', 'error');
    } finally {
      setIsNotificationsSaving(false);
    }
  };

  const handleUnlinkAccount = async (provider) => {
    setIsLinkActionLoading(true);

    try {
      const nextState = await profileSettingsApi.unlinkAccount(provider);
      setLinkedAccounts({
        ...initialLinkedAccounts,
        ...nextState,
      });
      showSnackbar('Аккаунт отвязан', 'success');
    } catch {
      showSnackbar('Не удалось отвязать аккаунт', 'error');
    } finally {
      setIsLinkActionLoading(false);
    }
  };

  const handleLinkAccount = async (provider) => {
    setIsLinkActionLoading(true);

    try {
      const nextState = await profileSettingsApi.linkAccount(provider);
      setLinkedAccounts({
        ...initialLinkedAccounts,
        ...nextState,
      });
      showSnackbar('Интеграция готова к подключению backend', 'success');
    } catch {
      showSnackbar('Не удалось привязать аккаунт', 'error');
    } finally {
      setIsLinkActionLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const isFormDisabled = isPasswordSubmitting || isLinkedAccountsLoading;
  const isGithubLinked = Boolean(linkedAccounts.githubLogin);
  const isGitlabLinked = Boolean(linkedAccounts.gitlabLogin);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="profile-settings-modal__overlay"
      dialogClassName="profile-settings-modal"
      ariaLabelledBy="profile-settings-modal-title"
      title="Настройки профиля"
      titleId="profile-settings-modal-title"
      headerClassName="profile-settings-modal__header"
      titleClassName="profile-settings-modal__title"
      closeClassName="profile-settings-modal__close"
      closeAriaLabel="Закрыть настройки профиля"
    >
      {loadError ? (
        <div className="profile-settings-modal__load-error" role="alert">
          {loadError}
        </div>
      ) : (
        <div className="profile-settings-modal__grid">
          <section className="profile-settings-modal__section profile-settings-modal__section--security">
            <h3 className="profile-settings-modal__section-title">Безопасность</h3>

            <form className="profile-settings-modal__security-form" onSubmit={handleSubmit(submitPassword)}>
              <div className="profile-settings-modal__inputs">
                <div className="profile-settings-modal__input-group">
                  <input
                    className="profile-settings-modal__input"
                    type="password"
                    placeholder="Введите текущий пароль"
                    maxLength={50}
                    autoComplete="new-password"
                    disabled={isFormDisabled}
                    {...register('currentPassword')}
                  />
                  {getPasswordFieldError('currentPassword') && (
                    <p className="profile-settings-modal__input-error">{getPasswordFieldError('currentPassword')}</p>
                  )}
                </div>
                <div className="profile-settings-modal__input-group">
                  <input
                    className={`profile-settings-modal__input ${getPasswordFieldError('password') ? 'profile-settings-modal__input--error' : ''}`}
                    type="password"
                    placeholder="Введите новый пароль"
                    maxLength={50}
                    autoComplete="new-password"
                    disabled={isFormDisabled}
                    {...register('password')}
                  />
                  {getPasswordFieldError('password') && (
                    <p className="profile-settings-modal__input-error">{getPasswordFieldError('password')}</p>
                  )}
                </div>

                <div className="profile-settings-modal__input-group">
                  <input
                    className={`profile-settings-modal__input ${getPasswordFieldError('confirmPassword') ? 'profile-settings-modal__input--error' : ''}`}
                    type="password"
                    placeholder="Повторите новый пароль"
                    maxLength={50}
                    autoComplete="new-password"
                    disabled={isFormDisabled}
                    {...register('confirmPassword')}
                  />
                  {getPasswordFieldError('confirmPassword') && (
                    <p className="profile-settings-modal__input-error">{getPasswordFieldError('confirmPassword')}</p>
                  )}
                </div>
              </div>

              <button
                className="profile-settings-modal__action-button profile-settings-modal__action-button--reset"
                type="submit"
                disabled={!isPasswordFormValid || isPasswordSubmitting}
              >
                <RefreshCycleIcon />
              </button>
            </form>
          </section>

          <section className="profile-settings-modal__section profile-settings-modal__section--notifications">
            <h3 className="profile-settings-modal__section-title">Уведомления</h3>

            <div className="profile-settings-modal__notifications">
              <label className="profile-settings-modal__checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(notifications.reviewAssignments)}
                  onChange={() => handleNotificationChange('reviewAssignments')}
                  disabled={isNotificationsSaving || isLinkedAccountsLoading}
                />
                <span>Назначение на ревью</span>
              </label>

              <label className="profile-settings-modal__checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(notifications.newComments)}
                  onChange={() => handleNotificationChange('newComments')}
                  disabled={isNotificationsSaving || isLinkedAccountsLoading}
                />
                <span>Новые комментарии к моим решениям</span>
              </label>

              <label className="profile-settings-modal__checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(notifications.achievements)}
                  onChange={() => handleNotificationChange('achievements')}
                  disabled={isNotificationsSaving || isLinkedAccountsLoading}
                />
                <span>Получение достижений</span>
              </label>
            </div>
          </section>

          <section className="profile-settings-modal__section profile-settings-modal__section--accounts">
            <h3 className="profile-settings-modal__section-title">Связанные аккаунты</h3>

            <div className="profile-settings-modal__accounts-grid">
              <article className="profile-settings-modal__account profile-settings-modal__account--github">
                <h4 className="profile-settings-modal__account-title">GitHub</h4>
                {isGithubLinked ? (
                  <div className="profile-settings-modal__account-row">
                    <span className="profile-settings-modal__account-login">{linkedAccounts.githubLogin}</span>
                    <button
                      className="profile-settings-modal__unlink-button"
                      type="button"
                      onClick={() => handleUnlinkAccount('github')}
                      disabled={isLinkActionLoading || isLinkedAccountsLoading}
                      aria-label="Отвязать GitHub аккаунт"
                    >
                      <CrossIcon />
                    </button>
                  </div>
                ) : (
                  <button
                    className="profile-settings-modal__action-button profile-settings-modal__action-button--link"
                    type="button"
                    onClick={() => handleLinkAccount('github')}
                    disabled={isLinkActionLoading || isLinkedAccountsLoading}
                  >
                    Привязать аккаунт
                  </button>
                )}
              </article>

              <article className="profile-settings-modal__account profile-settings-modal__account--gitlab">
                <h4 className="profile-settings-modal__account-title">GitLab</h4>
                {isGitlabLinked ? (
                  <div className="profile-settings-modal__account-row">
                    <span className="profile-settings-modal__account-login">{linkedAccounts.gitlabLogin}</span>
                    <button
                      className="profile-settings-modal__unlink-button"
                      type="button"
                      onClick={() => handleUnlinkAccount('gitlab')}
                      disabled={isLinkActionLoading || isLinkedAccountsLoading}
                      aria-label="Отвязать GitLab аккаунт"
                    >
                      <CrossIcon />
                    </button>
                  </div>
                ) : (
                  <button
                    className="profile-settings-modal__action-button profile-settings-modal__action-button--link"
                    type="button"
                    onClick={() => handleLinkAccount('gitlab')}
                    disabled={isLinkActionLoading || isLinkedAccountsLoading}
                  >
                    Привязать аккаунт
                  </button>
                )}
              </article>
            </div>
          </section>
        </div>
      )}

      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />
    </ModalShell>
  );
};

export default ProfileSettingsModal;

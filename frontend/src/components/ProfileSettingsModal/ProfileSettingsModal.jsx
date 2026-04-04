import { useEffect, useMemo, useState, useCallback } from 'react';
import { profileSettingsApi } from '../../api/profileSettingsApi';
import { validateConfirmPassword, validatePassword } from '../../utils/auth';
import { useAuth } from '../../hooks/useAuth';
import Snackbar from '../Snackbar/Snackbar';
import { CrossIcon, RefreshCycleIcon } from '../Icons/Icons';
import './ProfileSettingsModal.css';

const initialPasswordForm = {
  password: '',
  confirmPassword: ''
};

const initialPasswordErrors = {
  password: '',
  confirmPassword: ''
};

const initialNotifications = {
  reviewAssignments: true,
  newComments: true,
  achievements: true
};

const initialLinkedAccounts = {
  githubLogin: '',
  gitlabLogin: ''
};

const ProfileSettingsModal = ({ isOpen = false, onClose }) => {
  const { userId } = useAuth();
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState(initialPasswordErrors);
  const [passwordTouched, setPasswordTouched] = useState({});
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState(initialLinkedAccounts);
  const [isLinkedAccountsLoading, setIsLinkedAccountsLoading] = useState(false);
  const [isLinkActionLoading, setIsLinkActionLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });

  const closeSnackbar = useCallback(() => {
    setSnackbar({ message: '', type: 'success' });
  }, []);

  const showSnackbar = useCallback((message, type = 'success') => {
    setSnackbar({ message, type });
  }, []);

  useEffect(() => {
    if (!snackbar.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      closeSnackbar();
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [closeSnackbar, snackbar.message]);

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
          profileSettingsApi.getNotificationSettings(userId),
          profileSettingsApi.getLinkedAccounts(userId)
        ]);

        if (isCancelled) {
          return;
        }

        setNotifications({
          ...initialNotifications,
          ...notificationSettings
        });

        setLinkedAccounts({
          ...initialLinkedAccounts,
          ...linkedAccountsState
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

  const validateField = (name, value, nextPasswordValue = passwordForm.password) => {
    if (name === 'password') {
      setPasswordErrors((previousState) => ({
        ...previousState,
        password: validatePassword(value),
        confirmPassword: passwordForm.confirmPassword
          ? validateConfirmPassword(passwordForm.confirmPassword, value)
          : previousState.confirmPassword
      }));
    }

    if (name === 'confirmPassword') {
      setPasswordErrors((previousState) => ({
        ...previousState,
        confirmPassword: validateConfirmPassword(value, nextPasswordValue)
      }));
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    const nextValue = value.slice(0, 50);

    setPasswordForm((previousState) => ({
      ...previousState,
      [name]: nextValue
    }));

    if (name === 'password') {
      validateField(name, nextValue);
      return;
    }

    validateField(name, nextValue);
  };

  const handlePasswordBlur = (event) => {
    const { name, value } = event.target;

    setPasswordTouched((previousState) => ({
      ...previousState,
      [name]: true
    }));

    validateField(name, value, passwordForm.password);
  };

  const getPasswordFieldError = (name) => {
    if (!(passwordTouched[name] || passwordSubmitted)) {
      return '';
    }

    return passwordErrors[name] || '';
  };

  const isPasswordFormValid = useMemo(() => {
    return Boolean(
      passwordForm.password &&
      passwordForm.confirmPassword &&
      !passwordErrors.password &&
      !passwordErrors.confirmPassword
    );
  }, [passwordErrors.confirmPassword, passwordErrors.password, passwordForm.confirmPassword, passwordForm.password]);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSubmitted(true);

    if (!isPasswordFormValid) {
      return;
    }

    setIsPasswordSubmitting(true);

    try {
      await profileSettingsApi.updatePassword(userId, passwordForm.password);
      showSnackbar('Пароль успешно обновлён', 'success');
      setPasswordForm(initialPasswordForm);
      setPasswordErrors(initialPasswordErrors);
      setPasswordTouched({});
      setPasswordSubmitted(false);
    } catch (error) {
      showSnackbar(error?.message || 'Не удалось обновить пароль', 'error');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleNotificationChange = async (key) => {
    const nextSettings = {
      ...notifications,
      [key]: !notifications[key]
    };

    setNotifications(nextSettings);
    setIsNotificationsSaving(true);

    try {
      await profileSettingsApi.updateNotificationSettings(userId, nextSettings);
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
      const nextState = await profileSettingsApi.unlinkAccount(userId, provider);
      setLinkedAccounts({
        ...initialLinkedAccounts,
        ...nextState
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
      const nextState = await profileSettingsApi.linkAccount(userId, provider);
      setLinkedAccounts({
        ...initialLinkedAccounts,
        ...nextState
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
    <div className="profile-settings-modal__overlay" role="presentation" onClick={onClose}>
      <div
        className="profile-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-settings-modal__header">
          <h2 className="profile-settings-modal__title" id="profile-settings-modal-title">Настройки профиля</h2>
          <button
            className="profile-settings-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки профиля"
          >
            <CrossIcon />
          </button>
        </div>

        {loadError ? (
        <div className="profile-settings-modal__load-error" role="alert">
          {loadError}
        </div>
        ) : (
        <div className="profile-settings-modal__grid">
          <section className="profile-settings-modal__section profile-settings-modal__section--security">
            <h3 className="profile-settings-modal__section-title">Безопасность</h3>

            <form className="profile-settings-modal__security-form" onSubmit={handlePasswordSubmit}>
              <div className="profile-settings-modal__inputs">
                <div className="profile-settings-modal__input-group">
                  <input
                    className={`profile-settings-modal__input ${getPasswordFieldError('password') ? 'profile-settings-modal__input--error' : ''}`}
                    type="password"
                    name="password"
                    placeholder="Введите новый пароль"
                    value={passwordForm.password}
                    maxLength={50}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    autoComplete="new-password"
                    disabled={isFormDisabled}
                  />
                  {getPasswordFieldError('password') && (
                    <p className="profile-settings-modal__input-error">{getPasswordFieldError('password')}</p>
                  )}
                </div>

                <div className="profile-settings-modal__input-group">
                  <input
                    className={`profile-settings-modal__input ${getPasswordFieldError('confirmPassword') ? 'profile-settings-modal__input--error' : ''}`}
                    type="password"
                    name="confirmPassword"
                    placeholder="Повторите новый пароль"
                    value={passwordForm.confirmPassword}
                    maxLength={50}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    autoComplete="new-password"
                    disabled={isFormDisabled}
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
      </div>
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />
    </div>
  );
};

export default ProfileSettingsModal;

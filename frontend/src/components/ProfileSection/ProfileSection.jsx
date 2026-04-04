import editIcon from '../../assets/edit-icon.svg';
import avatarPlaceholder from '../../assets/avatar-icon.svg';
import { ChangeIcon, CheckIcon, CrossIcon, DeleteIcon } from '../Icons/Icons';
import './ProfileSection.css';

const ProfileSection = ({
  canEditProfile,
  fileInputRef,
  isActionBlocked,
  isProfileEditMode,
  onAvatarDelete,
  onAvatarUpload,
  onNameChange,
  onProfileEditCancel,
  onProfileEditStart,
  onProfileSave,
  profileData,
  profileDraft,
  formatRegistrationDate
}) => {
  const profileAvatar = profileDraft.avatarPath || avatarPlaceholder;

  return (
    <section className="profile-page__section profile-page__section--profile">
      <div className="profile-page__section-head">
        <div className="profile-page__section-title-wrap">
          <h2 className="profile-page__section-title">Профиль</h2>
          {canEditProfile && !isProfileEditMode && (
            <button
              className="profile-page__edit-button"
              type="button"
              onClick={onProfileEditStart}
              disabled={isActionBlocked}
              aria-label="Редактировать профиль"
            >
              <img src={editIcon} alt="" width="20" height="20" />
            </button>
          )}
        </div>
      </div>

      <div className="profile-page__section-body profile-page__profile-body">
        <div className="profile-page__avatar-wrap">
          <img className="profile-page__avatar" src={profileAvatar} alt="Аватар пользователя" />
          {canEditProfile && isProfileEditMode && (
            <div className="profile-page__avatar-actions">
              {profileDraft.avatarPath && (
                <button
                  className="profile-page__avatar-action profile-page__avatar-action--danger"
                  type="button"
                  onClick={onAvatarDelete}
                  disabled={isActionBlocked}
                  aria-label="Удалить аватар"
                >
                  <DeleteIcon />
                </button>
              )}
              <button
                className="profile-page__avatar-action profile-page__avatar-action--accent"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isActionBlocked}
                aria-label="Загрузить аватар"
              >
                <ChangeIcon />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onAvatarUpload} hidden />
            </div>
          )}
        </div>

        <div className="profile-page__user-info">
          <p className="profile-page__user-row">
            <span className="profile-page__label">Имя:</span>
            {canEditProfile && isProfileEditMode ? (
              <input
                className="profile-page__name-input"
                type="text"
                maxLength={255}
                value={profileDraft.name}
                onChange={onNameChange}
                disabled={isActionBlocked}
              />
            ) : (
              <span className="profile-page__value">{profileData.name || 'Не задано'}</span>
            )}
          </p>
          <p className="profile-page__user-row">
            <span className="profile-page__label">E-Mail:</span>
            <span className="profile-page__value">{profileData.email || 'Не задано'}</span>
          </p>
          <p className="profile-page__user-row">
            <span className="profile-page__label">Логин:</span>
            <span className="profile-page__value">{profileData.login || 'Не задано'}</span>
          </p>
          <p className="profile-page__user-row">
            <span className="profile-page__label">Дата регистрации:</span>
            <span className="profile-page__value">{formatRegistrationDate(profileData.registeredAt)}</span>
          </p>
        </div>
      </div>

      {canEditProfile && isProfileEditMode && (
        <div className="profile-page__actions">
          <button
            className="profile-page__action profile-page__action--save"
            type="button"
            onClick={onProfileSave}
            disabled={isActionBlocked}
            aria-label="Сохранить профиль"
          >
            <CheckIcon />
          </button>
          <button
            className="profile-page__action profile-page__action--cancel"
            type="button"
            onClick={onProfileEditCancel}
            disabled={isActionBlocked}
            aria-label="Отменить изменения профиля"
          >
            <CrossIcon />
          </button>
        </div>
      )}
    </section>
  );
};

export default ProfileSection;

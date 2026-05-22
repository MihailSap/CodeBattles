import { AvatarIcon } from '@/shared/ui/icons';
import DeleteIcon from '@/shared/assets/delete-icon.svg';
import UploadIcon from '@/shared/assets/upload-icon.svg';
import { CheckIcon, CrossIcon, PencilIcon } from '@/shared/ui/icons';
import profileSectionStyles from './ProfileSection.module.scss';
import profilePageStyles from '../../../../pages/profile/ui/ProfilePage.module.scss';

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
  formatRegistrationDate,
}: LegacyValue) => {
  return (
    <section className={[profilePageStyles.section, profileSectionStyles.isProfile].join(' ')}>
      <div className={profilePageStyles.sectionHead}>
        <div className={profilePageStyles.sectionTitleWrap}>
          <h2 className={profilePageStyles.sectionTitle}>Профиль</h2>
          {canEditProfile && !isProfileEditMode && (
            <button
              className={profilePageStyles.editButton}
              type="button"
              onClick={onProfileEditStart}
              disabled={isActionBlocked}
              aria-label="Редактировать профиль"
            >
              <PencilIcon />
            </button>
          )}
        </div>
      </div>

      <div className={[profilePageStyles.sectionBody, profileSectionStyles.body].join(' ')}>
        <div className={profileSectionStyles.avatarWrap}>
          {canEditProfile && isProfileEditMode && (
            <div className={profileSectionStyles.avatarActions}>
              {profileDraft.avatarPath && (
                <button
                  className={[profileSectionStyles.avatarAction, profileSectionStyles.isDanger].join(' ')}
                  type="button"
                  onClick={onAvatarDelete}
                  disabled={isActionBlocked}
                  aria-label="Удалить аватар"
                >
                  <img src={DeleteIcon} alt="Удалить аватар" />
                </button>
              )}
              <button
                className={[profileSectionStyles.avatarAction, profileSectionStyles.isAccent].join(' ')}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isActionBlocked}
                aria-label="Загрузить аватар"
              >
                <img src={UploadIcon} alt="Загрузить аватар" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onAvatarUpload} hidden />
            </div>
          )}
          {profileDraft.avatarPath ? (
            <img
              className={[
                profileSectionStyles.avatar,
                canEditProfile && isProfileEditMode ? profileSectionStyles.isEditable : '',
              ].join(' ')}
              src={profileDraft.avatarPath}
              alt="Аватар пользователя"
            />
          ) : (
            <div
              className={[
                profileSectionStyles.avatar,
                canEditProfile && isProfileEditMode ? profileSectionStyles.isEditable : '',
              ].join(' ')}
            >
              <AvatarIcon />
            </div>
          )}
        </div>

        <div className={profileSectionStyles.userInfo}>
          <p className={profileSectionStyles.userRow}>
            <span className={profileSectionStyles.label}>Имя:</span>
            {canEditProfile && isProfileEditMode ? (
              <input
                className={profileSectionStyles.nameInput}
                type="text"
                maxLength={255}
                value={profileDraft.name}
                onChange={onNameChange}
                disabled={isActionBlocked}
              />
            ) : (
              <span className={profileSectionStyles.value}>{profileData.name || 'Не задано'}</span>
            )}
          </p>
          <p className={profileSectionStyles.userRow}>
            <span className={profileSectionStyles.label}>E-Mail:</span>
            <span className={profileSectionStyles.value}>{profileData.email || 'Не задано'}</span>
          </p>
          <p className={profileSectionStyles.userRow}>
            <span className={profileSectionStyles.label}>Логин:</span>
            <span className={profileSectionStyles.value}>{profileData.login || 'Не задано'}</span>
          </p>
          <p className={profileSectionStyles.userRow}>
            <span className={profileSectionStyles.label}>Дата регистрации:</span>
            <span className={profileSectionStyles.value}>{formatRegistrationDate(profileData.registeredAt)}</span>
          </p>
        </div>
      </div>

      {canEditProfile && isProfileEditMode && (
        <div className={profilePageStyles.actions}>
          <button
            className={[profilePageStyles.action, profilePageStyles.isSave].join(' ')}
            type="button"
            onClick={onProfileSave}
            disabled={isActionBlocked}
            aria-label="Сохранить профиль"
          >
            <CheckIcon />
          </button>
          <button
            className={[profilePageStyles.action, profilePageStyles.isCancel].join(' ')}
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

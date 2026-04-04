import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { profileApi } from '../../api/profileApi';
import settingsIcon from '../../assets/settings-icon.svg';
import AchievementsSection from '../../components/AchievementsSection/AchievementsSection';
import Header from '../../components/Header/Header';
import ProfileSection from '../../components/ProfileSection/ProfileSection';
import SkillsSection from '../../components/SkillsSection/SkillsSection';
import Snackbar from '../../components/Snackbar/Snackbar';
import Spinner from '../../components/Spinner/Spinner';
import StatisticsSection from '../../components/StatisticsSection/StatisticsSection';
import { SKILL_GROUPS } from '../../constants/profileSkills';
import { useAuth } from '../../hooks/useAuth';
import { useSkillsPopup } from '../../hooks/useSkillsPopup';
import { patchAuthUser } from '../../store/slices/authSlice';
import './ProfilePage.css';

import ProfileSettingsModal from '../../components/ProfileSettingsModal/ProfileSettingsModal';

const EMPTY_PROFILE = {
  name: '',
  email: '',
  login: '',
  registeredAt: '',
  avatarPath: ''
};

const EMPTY_SKILLS = SKILL_GROUPS.reduce((accumulator, group) => {
  accumulator[group.key] = [];
  return accumulator;
}, {});

const DEFAULT_STATISTICS = {
  qualityScore: 0,
  aiQualityScore: 0,
  usefulnessIndex: 0,
  reviewDepth: 0,
  acceptedDecisionsPercent: 0
};

const STAT_CARDS = [
  { key: 'qualityScore', title: 'Оценка качества' },
  { key: 'aiQualityScore', title: 'Оценка качества от ИИ' },
  { key: 'usefulnessIndex', title: 'Индекс полезности' },
  { key: 'reviewDepth', title: 'Глубина ревью' }
];

const sortByAlphabet = (values = []) =>
  [...values].sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }));

const normalizeSkills = (skillsFromServer) => {
  const normalized = { ...EMPTY_SKILLS };

  SKILL_GROUPS.forEach((group) => {
    const groupSkills = Array.isArray(skillsFromServer?.[group.key]) ? skillsFromServer[group.key] : [];
    normalized[group.key] = sortByAlphabet(groupSkills.filter((item) => typeof item === 'string' && item.trim()));
  });

  return normalized;
};

const formatRegistrationDate = (value) => {
  if (!value) {
    return 'Не задано';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Не задано';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const getPercentClass = (percent) => {
  if (percent <= 40) {
    return 'profile-page__accepted-percent--error';
  }

  if (percent <= 80) {
    return 'profile-page__accepted-percent--warning';
  }

  return 'profile-page__accepted-percent--success';
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, userId } = useAuth();
  const { userId: routeUserId } = useParams();
  const fileInputRef = useRef(null);
  const createdAvatarUrlsRef = useRef(new Set());
  const profileFallbackRef = useRef({
    name: '',
    email: '',
    login: '',
    registeredAt: '',
    avatarPath: ''
  });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isSkillsSaving, setIsSkillsSaving] = useState(false);
  const [isProfileEditMode, setIsProfileEditMode] = useState(false);
  const [isSkillsEditMode, setIsSkillsEditMode] = useState(false);
  const [profileData, setProfileData] = useState(EMPTY_PROFILE);
  const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE);
  const [skillsData, setSkillsData] = useState(EMPTY_SKILLS);
  const [skillsDraft, setSkillsDraft] = useState(EMPTY_SKILLS);
  const [statistics, setStatistics] = useState(DEFAULT_STATISTICS);
  const [achievements, setAchievements] = useState([]);
  const [receivedAchievementIds, setReceivedAchievementIds] = useState([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });
  const { openedSkillsPopup, popupDirection, popupMaxHeight, mobilePopupPosition, closeSkillsPopup, openSkillsPopup } =
    useSkillsPopup();
  const normalizedRouteUserId = routeUserId ? String(routeUserId) : '';
  const isOwnProfile = !normalizedRouteUserId || normalizedRouteUserId === String(userId ?? '');
  const canEditProfile = isOwnProfile;

  profileFallbackRef.current = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    login: user?.login ?? '',
    registeredAt: user?.registeredAt ?? '',
    avatarPath: user?.avatarPath ?? ''
  };

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
    const createdAvatarUrls = createdAvatarUrlsRef.current;

    return () => {
      createdAvatarUrls.forEach((url) => URL.revokeObjectURL(url));
      createdAvatarUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (canEditProfile) {
      return;
    }

    setIsProfileEditMode(false);
    setIsSkillsEditMode(false);
    setIsSettingsModalOpen(false);
    closeSkillsPopup();
  }, [canEditProfile, closeSkillsPopup]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsPageLoading(true);

      try {
        const payload = await profileApi.getProfilePageData(normalizedRouteUserId || null);

        if (isCancelled) {
          return;
        }

        const fallbackProfile = profileFallbackRef.current;
        const normalizedProfile = {
          name: payload?.user?.name ?? (isOwnProfile ? fallbackProfile.name : ''),
          email: payload?.user?.email ?? (isOwnProfile ? fallbackProfile.email : ''),
          login: payload?.user?.login ?? (isOwnProfile ? fallbackProfile.login : ''),
          registeredAt: payload?.user?.registeredAt ?? (isOwnProfile ? fallbackProfile.registeredAt : ''),
          avatarPath: payload?.user?.avatarPath ?? (isOwnProfile ? fallbackProfile.avatarPath : '')
        };
        const normalizedSkills = normalizeSkills(payload?.skills);

        setProfileData(normalizedProfile);
        setProfileDraft(normalizedProfile);
        setSkillsData(normalizedSkills);
        setSkillsDraft(normalizedSkills);
        setStatistics({
          ...DEFAULT_STATISTICS,
          ...(payload?.statistics || {})
        });
        setAchievements(Array.isArray(payload?.achievements) ? payload.achievements : []);
        setReceivedAchievementIds(Array.isArray(payload?.receivedAchievementIds) ? payload.receivedAchievementIds : []);
      } catch {
        if (!isCancelled) {
          showSnackbar('Не удалось загрузить данные личного кабинета', 'error');
        }
      } finally {
        if (!isCancelled) {
          setIsPageLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [isOwnProfile, normalizedRouteUserId, showSnackbar, user?.id]);

  const acceptedDecisionsPercent = Math.max(0, Math.min(100, Number(statistics.acceptedDecisionsPercent) || 0));

  const skillsByGroup = useMemo(() => {
    return SKILL_GROUPS.map((group) => ({
      ...group,
      selected: sortByAlphabet(skillsData[group.key] || [])
    }));
  }, [skillsData]);

  const skillsDraftByGroup = useMemo(() => {
    return SKILL_GROUPS.map((group) => {
      const selected = sortByAlphabet(skillsDraft[group.key] || []);
      const selectedSet = new Set(selected);
      const unselected = sortByAlphabet(group.options.filter((option) => !selectedSet.has(option)));
      const selectedSorted = sortByAlphabet(group.options.filter((option) => selectedSet.has(option)));

      return {
        ...group,
        selected,
        orderedOptions: [...unselected, ...selectedSorted]
      };
    });
  }, [skillsDraft]);

  const receivedAchievementIdSet = useMemo(() => new Set(receivedAchievementIds), [receivedAchievementIds]);

  const orderedAchievements = useMemo(() => {
    return [...achievements].sort((left, right) => {
      const leftReceived = receivedAchievementIdSet.has(left.id) ? 0 : 1;
      const rightReceived = receivedAchievementIdSet.has(right.id) ? 0 : 1;

      if (leftReceived !== rightReceived) {
        return leftReceived - rightReceived;
      }

      return left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' });
    });
  }, [achievements, receivedAchievementIdSet]);

  const visibleAchievements = useMemo(() => {
    if (canEditProfile) {
      return orderedAchievements;
    }

    return orderedAchievements.filter((achievement) => receivedAchievementIdSet.has(achievement.id));
  }, [canEditProfile, orderedAchievements, receivedAchievementIdSet]);

  const removeTemporaryAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return;
    }

    if (avatarUrl.startsWith('blob:') && createdAvatarUrlsRef.current.has(avatarUrl)) {
      URL.revokeObjectURL(avatarUrl);
      createdAvatarUrlsRef.current.delete(avatarUrl);
    }
  };

  const handleProfileEditStart = () => {
    if (!canEditProfile) {
      return;
    }

    setProfileDraft(profileData);
    setIsProfileEditMode(true);
  };

  const handleProfileEditCancel = () => {
    if (!canEditProfile) {
      return;
    }

    removeTemporaryAvatarUrl(profileDraft.avatarPath);
    setProfileDraft(profileData);
    setIsProfileEditMode(false);
  };

  const handleNameChange = (event) => {
    setProfileDraft((previousState) => ({
      ...previousState,
      name: event.target.value.slice(0, 255)
    }));
  };

  const handleAvatarDelete = async () => {
    if (!canEditProfile) {
      return;
    }

    try {
      await profileApi.deleteAvatar();
      removeTemporaryAvatarUrl(profileDraft.avatarPath);
      setProfileDraft((previousState) => ({
        ...previousState,
        avatarPath: ''
      }));
    } catch {
      showSnackbar('Не удалось удалить аватар', 'error');
    }
  };

  const handleAvatarUpload = async (event) => {
    if (!canEditProfile) {
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const response = await profileApi.uploadAvatar(file);
      removeTemporaryAvatarUrl(profileDraft.avatarPath);

      if (response.avatarPath?.startsWith('blob:')) {
        createdAvatarUrlsRef.current.add(response.avatarPath);
      }

      setProfileDraft((previousState) => ({
        ...previousState,
        avatarPath: response.avatarPath || ''
      }));
    } catch {
      showSnackbar('Не удалось загрузить аватар', 'error');
    }
  };

  const handleProfileSave = async () => {
    if (!canEditProfile) {
      return;
    }

    setIsProfileSaving(true);

    try {
      const savedProfile = await profileApi.updateProfileSection({
        name: profileDraft.name.trim(),
        avatarPath: profileDraft.avatarPath
      });
      const nextProfile = {
        ...profileData,
        ...savedProfile
      };

      setProfileData(nextProfile);
      setProfileDraft(nextProfile);
      setIsProfileEditMode(false);
      dispatch(
        patchAuthUser({
          name: nextProfile.name,
          registeredAt: nextProfile.registeredAt,
          avatarPath: nextProfile.avatarPath
        })
      );
      showSnackbar('Профиль успешно обновлён', 'success');
    } catch {
      showSnackbar('Не удалось сохранить данные профиля', 'error');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleSkillsEditStart = () => {
    if (!canEditProfile) {
      return;
    }

    setSkillsDraft(skillsData);
    setIsSkillsEditMode(true);
  };

  const handleSkillsEditCancel = () => {
    if (!canEditProfile) {
      return;
    }

    setSkillsDraft(skillsData);
    closeSkillsPopup();
    setIsSkillsEditMode(false);
  };

  const toggleSkill = (groupKey, skillName) => {
    if (!canEditProfile) {
      return;
    }

    setSkillsDraft((previousState) => {
      const groupSkills = previousState[groupKey] || [];
      const hasSkill = groupSkills.includes(skillName);
      const nextSkills = hasSkill ? groupSkills.filter((item) => item !== skillName) : [...groupSkills, skillName];

      return {
        ...previousState,
        [groupKey]: sortByAlphabet(nextSkills)
      };
    });
  };

  const clearSkillGroup = (groupKey) => {
    if (!canEditProfile) {
      return;
    }

    setSkillsDraft((previousState) => ({
      ...previousState,
      [groupKey]: []
    }));
  };

  const handleSkillsSave = async () => {
    if (!canEditProfile) {
      return;
    }

    setIsSkillsSaving(true);

    try {
      const savedSkills = await profileApi.updateSkillsSection(skillsDraft);
      const normalizedSkills = normalizeSkills(savedSkills);

      setSkillsData(normalizedSkills);
      setSkillsDraft(normalizedSkills);
      closeSkillsPopup();
      setIsSkillsEditMode(false);
      showSnackbar('Стек успешно обновлён', 'success');
    } catch {
      showSnackbar('Не удалось сохранить стек', 'error');
    } finally {
      setIsSkillsSaving(false);
    }
  };

  const isActionBlocked = isPageLoading || isProfileSaving || isSkillsSaving;

  return (
    <div className="profile-page">
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className="profile-page__content">
        {isPageLoading ? (
          <div className="profile-page__loader">
            <Spinner />
          </div>
        ) : (
          <div className="profile-page__grid">
            <div className="profile-page__grid-left">
              <ProfileSection
                canEditProfile={canEditProfile}
                fileInputRef={fileInputRef}
                isActionBlocked={isActionBlocked}
                isProfileEditMode={isProfileEditMode}
                onAvatarDelete={handleAvatarDelete}
                onAvatarUpload={handleAvatarUpload}
                onNameChange={handleNameChange}
                onProfileEditCancel={handleProfileEditCancel}
                onProfileEditStart={handleProfileEditStart}
                onProfileSave={handleProfileSave}
                profileData={profileData}
                profileDraft={profileDraft}
                formatRegistrationDate={formatRegistrationDate}
              />

              <SkillsSection
                canEditProfile={canEditProfile}
                isActionBlocked={isActionBlocked}
                isSkillsEditMode={isSkillsEditMode}
                mobilePopupPosition={mobilePopupPosition}
                onClearGroup={clearSkillGroup}
                onOpenSkillsPopup={openSkillsPopup}
                onSkillsEditCancel={handleSkillsEditCancel}
                onSkillsEditStart={handleSkillsEditStart}
                onSkillsSave={handleSkillsSave}
                onToggleSkill={toggleSkill}
                openedSkillsPopup={openedSkillsPopup}
                popupDirection={popupDirection}
                popupMaxHeight={popupMaxHeight}
                skillsByGroup={skillsByGroup}
                skillsDraftByGroup={skillsDraftByGroup}
              />
            </div>

            <div className="profile-page__grid-right">
              <StatisticsSection
                acceptedDecisionsPercent={acceptedDecisionsPercent}
                getPercentClass={getPercentClass}
                statCards={STAT_CARDS}
                statistics={statistics}
              />

              <AchievementsSection
                achievements={visibleAchievements}
                canEditProfile={canEditProfile}
                receivedAchievementIdSet={receivedAchievementIdSet}
              />
            </div>
          </div>
        )}
      </main>

      {canEditProfile && (
        <button
          className="profile-page__settings-button"
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          aria-label="Открыть настройки профиля"
        >
          <img src={settingsIcon} alt="" width="26" height="26" />
        </button>
      )}

      {canEditProfile && (
        <ProfileSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;

import { type ChangeEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch } from '@/app/providers/store';
import { useParams } from 'react-router-dom';
import {
  useDeleteAvatarMutation,
  useGetProfilePageDataQuery,
  useUpdateProfileSectionMutation,
  useUpdateSkillsSectionMutation,
  type ProfileSkills,
  type ProfileStatistics,
} from '@/entities/profile';
import { SettingsIcon } from '@/shared/ui/icons';
import { AchievementsSection, type Achievement } from '@/entities/achievement';
import { ProfileSection } from '@/widgets/profile-overview';
import { SkillsSection } from '@/widgets/profile-overview';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import { StatisticsSection } from '@/widgets/profile-overview';
import { SKILL_GROUPS } from '@/entities/stack';
import { useAuth } from '@/entities/session';
import { useSnackbar } from '@/shared/lib/hooks';
import { useSkillsPopup, type SkillGroupKey } from '@/widgets/profile-overview';
import { patchAuthUser } from '@/entities/session';
import profilePageStyles from './ProfilePage.module.scss';
import statisticsSectionStyles from '../../../widgets/profile-overview/ui/statistics-section/StatisticsSection.module.scss';

const ProfileSettingsModal = lazy(() =>
  import('@/features/update-profile-settings').then(({ ProfileSettingsModal }) => ({ default: ProfileSettingsModal }))
);

interface ProfileDisplayData {
  name: string;
  email: string;
  login: string;
  registeredAt: string;
  avatarPath: string;
}

const EMPTY_PROFILE: ProfileDisplayData = {
  name: '',
  email: '',
  login: '',
  registeredAt: '',
  avatarPath: '',
};

const EMPTY_SKILLS: ProfileSkills = {
  languages: [],
  frameworks: [],
  tools: [],
};

const DEFAULT_STATISTICS: ProfileStatistics = {
  qualityScore: 0,
  aiQualityScore: 0,
  usefulnessIndex: 0,
  reviewDepth: 0,
  acceptedDecisionsPercent: 0,
};

const STAT_CARDS = [
  {
    key: 'qualityScore',
    title: 'Оценка качества',
  },
  {
    key: 'aiQualityScore',
    title: 'Оценка качества от ИИ',
  },
  {
    key: 'usefulnessIndex',
    title: 'Индекс полезности',
  },
  {
    key: 'reviewDepth',
    title: 'Глубина ревью',
  },
] satisfies readonly { key: keyof Omit<ProfileStatistics, 'acceptedDecisionsPercent'>; title: string }[];

const sortByAlphabet = (values: readonly string[] = []): string[] =>
  [...values].sort((a, b) =>
    a.localeCompare(b, 'ru', {
      sensitivity: 'base',
    })
  );

const normalizeSkills = (skillsFromServer: ProfileSkills | null | undefined): ProfileSkills => ({
  languages: sortByAlphabet(skillsFromServer?.languages.filter((item) => item.trim()) ?? []),
  frameworks: sortByAlphabet(skillsFromServer?.frameworks.filter((item) => item.trim()) ?? []),
  tools: sortByAlphabet(skillsFromServer?.tools.filter((item) => item.trim()) ?? []),
});

const formatRegistrationDate = (value: string): string => {
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
    year: 'numeric',
  }).format(date);
};

const getPercentClass = (percent: number): string => {
  if (percent <= 40) {
    return statisticsSectionStyles.isError;
  }

  if (percent <= 80) {
    return statisticsSectionStyles.isWarning;
  }

  return statisticsSectionStyles.isSuccess;
};

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user, userId } = useAuth();
  const { userId: routeUserId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdAvatarUrlsRef = useRef(new Set<string>());

  const profileFallbackRef = useRef({
    name: '',
    email: '',
    login: '',
    registeredAt: '',
    avatarPath: '',
  });

  const [isProfileEditMode, setIsProfileEditMode] = useState(false);
  const [isSkillsEditMode, setIsSkillsEditMode] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDisplayData>(EMPTY_PROFILE);
  const [profileDraft, setProfileDraft] = useState<ProfileDisplayData>(EMPTY_PROFILE);
  const [skillsData, setSkillsData] = useState<ProfileSkills>(EMPTY_SKILLS);
  const [skillsDraft, setSkillsDraft] = useState<ProfileSkills>(EMPTY_SKILLS);
  const [statistics, setStatistics] = useState<ProfileStatistics>(DEFAULT_STATISTICS);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [receivedAchievementIds, setReceivedAchievementIds] = useState<number[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [shouldDeleteAvatar, setShouldDeleteAvatar] = useState(false);

  const { openedSkillsPopup, popupMaxHeight, mobilePopupPosition, closeSkillsPopup, openSkillsPopup } =
    useSkillsPopup();

  const normalizedRouteUserId = routeUserId ? String(routeUserId) : '';
  const isOwnProfile = !normalizedRouteUserId || normalizedRouteUserId === String(userId ?? '');
  const canEditProfile = isOwnProfile;
  const profileQueryArg = isOwnProfile ? 'me' : normalizedRouteUserId;

  const {
    data: profilePayload,
    isLoading: isPageLoading,
    isError: isProfileLoadError,
  } = useGetProfilePageDataQuery(profileQueryArg, {
    skip: !isOwnProfile && !normalizedRouteUserId,
    refetchOnMountOrArgChange: 60,
  });

  const [deleteAvatar] = useDeleteAvatarMutation();
  const [updateProfileSection, { isLoading: isProfileSaving }] = useUpdateProfileSectionMutation();
  const [updateSkillsSection, { isLoading: isSkillsSaving }] = useUpdateSkillsSectionMutation();

  useEffect(() => {
    profileFallbackRef.current = {
      name: user?.name ?? '',
      email: user?.email ?? '',
      login: user?.login ?? '',
      registeredAt: user?.registeredAt ?? '',
      avatarPath: user?.avatarPath ?? '',
    };
  }, [user?.avatarPath, user?.email, user?.login, user?.name, user?.registeredAt]);

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

    queueMicrotask(() => {
      setIsProfileEditMode(false);
      setIsSkillsEditMode(false);
      setIsSettingsModalOpen(false);
      closeSkillsPopup();
    });
  }, [canEditProfile, closeSkillsPopup]);

  useEffect(() => {
    if (isProfileLoadError) {
      showSnackbar('Не удалось загрузить данные личного кабинета', 'error');
    }
  }, [isProfileLoadError, showSnackbar]);

  useEffect(() => {
    if (!profilePayload) {
      return;
    }

    const fallbackProfile = profileFallbackRef.current;

    const normalizedProfile = {
      name: profilePayload?.user?.name ?? (isOwnProfile ? fallbackProfile.name : ''),
      email: profilePayload?.user?.email ?? (isOwnProfile ? fallbackProfile.email : ''),
      login: profilePayload?.user?.login ?? (isOwnProfile ? fallbackProfile.login : ''),
      registeredAt: profilePayload?.user?.registeredAt ?? (isOwnProfile ? fallbackProfile.registeredAt : ''),
      avatarPath: profilePayload?.user?.avatarPath ?? (isOwnProfile ? fallbackProfile.avatarPath : ''),
    };

    const normalizedSkills = normalizeSkills(profilePayload?.skills);

    queueMicrotask(() => {
      setProfileData(normalizedProfile);
      setProfileDraft(normalizedProfile);
      setSkillsData(normalizedSkills);
      setSkillsDraft(normalizedSkills);

      setStatistics({
        ...DEFAULT_STATISTICS,
        ...(profilePayload?.statistics || {}),
      });

      setAchievements(Array.isArray(profilePayload?.achievements) ? profilePayload.achievements : []);

      setReceivedAchievementIds(
        Array.isArray(profilePayload?.receivedAchievementIds) ? profilePayload.receivedAchievementIds : []
      );
    });
  }, [isOwnProfile, profilePayload]);

  const acceptedDecisionsPercent = Math.max(0, Math.min(100, Number(statistics.acceptedDecisionsPercent) || 0));

  const skillsByGroup = useMemo(() => {
    return SKILL_GROUPS.map((group) => ({
      ...group,
      selected: sortByAlphabet(skillsData[group.key] || []),
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
        orderedOptions: [...unselected, ...selectedSorted],
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

      return left.name.localeCompare(right.name, 'ru', {
        sensitivity: 'base',
      });
    });
  }, [achievements, receivedAchievementIdSet]);

  const visibleAchievements = useMemo(() => {
    if (canEditProfile) {
      return orderedAchievements.filter(
        (achievement) => achievement.visible || receivedAchievementIdSet.has(achievement.id)
      );
    }

    return orderedAchievements.filter((achievement) => receivedAchievementIdSet.has(achievement.id));
  }, [canEditProfile, orderedAchievements, receivedAchievementIdSet]);

  const removeTemporaryAvatarUrl = (avatarUrl: string): void => {
    if (!avatarUrl) {
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

    setPendingAvatarFile(null);
    setShouldDeleteAvatar(false);
    setProfileDraft(profileData);
    setIsProfileEditMode(true);
  };

  const handleProfileEditCancel = () => {
    if (!canEditProfile) {
      return;
    }

    removeTemporaryAvatarUrl(profileDraft.avatarPath);
    setPendingAvatarFile(null);
    setShouldDeleteAvatar(false);
    setProfileDraft(profileData);
    setIsProfileEditMode(false);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProfileDraft((previousState) => ({
      ...previousState,
      name: event.target.value.slice(0, 255),
    }));
  };

  const handleAvatarDelete = async () => {
    if (!canEditProfile) {
      return;
    }

    removeTemporaryAvatarUrl(profileDraft.avatarPath);
    setPendingAvatarFile(null);
    setShouldDeleteAvatar(true);

    setProfileDraft((previousState) => ({
      ...previousState,
      avatarPath: '',
    }));
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canEditProfile) {
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    removeTemporaryAvatarUrl(profileDraft.avatarPath);
    setPendingAvatarFile(file);
    setShouldDeleteAvatar(false);

    setProfileDraft((previousState) => ({
      ...previousState,
      avatarPath: localPreviewUrl,
    }));

    createdAvatarUrlsRef.current.add(localPreviewUrl);
  };

  const handleProfileSave = async () => {
    if (!canEditProfile) {
      return;
    }

    try {
      if (shouldDeleteAvatar) {
        await deleteAvatar(undefined).unwrap();
      }

      const savedProfile = await updateProfileSection({
        name: profileDraft.name.trim(),
        avatar: pendingAvatarFile,
      }).unwrap();

      const nextProfile = {
        ...profileData,
        ...savedProfile,
      };

      setProfileData(nextProfile);
      setProfileDraft(nextProfile);
      setPendingAvatarFile(null);
      setShouldDeleteAvatar(false);
      setIsProfileEditMode(false);

      dispatch(
        patchAuthUser({
          name: nextProfile.name,
          registeredAt: nextProfile.registeredAt,
          avatarPath: nextProfile.avatarPath,
        })
      );

      showSnackbar('Профиль успешно обновлён', 'success');
    } catch {
      showSnackbar('Не удалось сохранить данные профиля', 'error');
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

  const toggleSkill = (groupKey: SkillGroupKey, skillName: string) => {
    if (!canEditProfile) {
      return;
    }

    setSkillsDraft((previousState) => {
      const groupSkills = previousState[groupKey] || [];
      const hasSkill = groupSkills.includes(skillName);

      const nextSkills = hasSkill ? groupSkills.filter((item) => item !== skillName) : [...groupSkills, skillName];

      return {
        ...previousState,
        [groupKey]: sortByAlphabet(nextSkills),
      };
    });
  };

  const clearSkillGroup = (groupKey: SkillGroupKey) => {
    if (!canEditProfile) {
      return;
    }

    setSkillsDraft((previousState) => ({
      ...previousState,
      [groupKey]: [],
    }));
  };

  const handleSkillsSave = async () => {
    if (!canEditProfile) {
      return;
    }

    try {
      const savedSkills = await updateSkillsSection({
        userId: userId ?? 'me',
        skills: skillsDraft,
      }).unwrap();

      const normalizedSkills = normalizeSkills(savedSkills);
      setSkillsData(normalizedSkills);
      setSkillsDraft(normalizedSkills);
      closeSkillsPopup();
      setIsSkillsEditMode(false);
      showSnackbar('Стек успешно обновлён', 'success');
    } catch {
      showSnackbar('Не удалось сохранить стек', 'error');
    }
  };

  const isActionBlocked = isPageLoading || isProfileSaving || isSkillsSaving;

  return (
    <div className={profilePageStyles.root}>
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className={profilePageStyles.content}>
        {isPageLoading ? (
          <div className={profilePageStyles.loader}>
            <Spinner />
          </div>
        ) : (
          <div className={profilePageStyles.grid}>
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
              popupMaxHeight={popupMaxHeight}
              skillsByGroup={skillsByGroup}
              skillsDraftByGroup={skillsDraftByGroup}
            />
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
        )}
      </main>

      {canEditProfile && (
        <button
          className={profilePageStyles.settingsButton}
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          aria-label="Открыть настройки профиля"
        >
          <SettingsIcon />
        </button>
      )}

      {canEditProfile && isSettingsModalOpen && (
        <Suspense fallback={null}>
          <ProfileSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default ProfilePage;

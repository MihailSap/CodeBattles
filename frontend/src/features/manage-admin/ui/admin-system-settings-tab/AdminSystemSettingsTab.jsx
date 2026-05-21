import { useEffect, useState } from 'react';
import {
  useGetAdminSystemSettingsQuery,
  useUpdateAdminAiSystemPromptMutation,
  useUpdateAdminReviewDeadlineDaysMutation,
} from '@/entities/admin';
import Spinner from '@/shared/ui/spinner';
import { CheckIcon, CrossIcon, DislikeIcon, LikeIcon } from '@/shared/ui/icons';
import Snackbar from '@/shared/ui/snackbar';
import { useDebouncedValue, useSnackbar } from '@/shared/lib/hooks';
import { getApiErrorMessage } from '@/shared/lib';
import adminSystemSettingsTabStyles from './AdminSystemSettingsTab.module.scss';
import adminComplaintsTabStyles from '../admin-complaints-tab/AdminComplaintsTab.module.scss';
const DEADLINE_SAVE_DEBOUNCE_MS = 650;
const MAX_PROMPT_LENGTH = 5000;

const AdminSystemSettingsTab = ({ isActive, actor }) => {
  const [reviewDeadlineDays, setReviewDeadlineDays] = useState(14);
  const [lastSavedDeadlineDays, setLastSavedDeadlineDays] = useState(14);
  const [promptDraft, setPromptDraft] = useState('');
  const [savedPrompt, setSavedPrompt] = useState('');
  const [error, setError] = useState('');
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const debouncedDeadlineDays = useDebouncedValue(reviewDeadlineDays, DEADLINE_SAVE_DEBOUNCE_MS);

  const settingsQuery = useGetAdminSystemSettingsQuery(undefined, {
    skip: !isActive,
    refetchOnMountOrArgChange: 30,
  });

  const [updateDeadline, updateDeadlineState] = useUpdateAdminReviewDeadlineDaysMutation();
  const [updatePrompt, updatePromptState] = useUpdateAdminAiSystemPromptMutation();

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    const nextDeadline = settingsQuery.data.reviewDeadlineDays || 14;
    const nextPrompt = settingsQuery.data.aiSystemPrompt || '';

    queueMicrotask(() => {
      setReviewDeadlineDays(nextDeadline);
      setLastSavedDeadlineDays(nextDeadline);
      setPromptDraft(nextPrompt);
      setSavedPrompt(nextPrompt);
    });
  }, [settingsQuery.data]);

  useEffect(() => {
    if (!isActive || !settingsQuery.data || debouncedDeadlineDays === lastSavedDeadlineDays) {
      return;
    }

    const saveDeadline = async () => {
      try {
        setError('');

        const response = await updateDeadline({
          reviewDeadlineDays: debouncedDeadlineDays,
          actor,
        }).unwrap();

        setLastSavedDeadlineDays(response.reviewDeadlineDays);
        showSnackbar(`Срок проверки ревью сохранен: ${response.reviewDeadlineDays} дней`, 'success');
      } catch (requestError) {
        const message = getApiErrorMessage(
          requestError,
          'Не удалось сохранить срок ревью',
          'updateAdminReviewDeadlineDays'
        );

        setError(message);
        setReviewDeadlineDays(lastSavedDeadlineDays);
        showSnackbar(message, 'error');
      }
    };

    saveDeadline();
  }, [actor, debouncedDeadlineDays, isActive, lastSavedDeadlineDays, settingsQuery.data, showSnackbar, updateDeadline]);

  const queryError = settingsQuery.isError
    ? getApiErrorMessage(settingsQuery.error, 'Не удалось загрузить настройки системы', 'getAdminSystemSettings')
    : '';

  const visibleError = error || queryError;
  const hasPromptChanges = promptDraft !== savedPrompt;
  const stats = settingsQuery.data?.aiFeedbackStats;
  const totalReactions = (stats?.totalLikes || 0) + (stats?.totalDislikes || 0);
  const likesPercent = totalReactions > 0 ? Math.round(((stats?.totalLikes || 0) / totalReactions) * 100) : 0;
  const dislikesPercent = totalReactions > 0 ? 100 - likesPercent : 0;

  const handlePromptSave = async () => {
    try {
      setError('');

      const response = await updatePrompt({
        aiSystemPrompt: promptDraft,
        actor,
      }).unwrap();

      setSavedPrompt(response.aiSystemPrompt);
      setPromptDraft(response.aiSystemPrompt);
      showSnackbar('Системный промпт сохранен', 'success');
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        'Не удалось сохранить системный промпт',
        'updateAdminAiSystemPrompt'
      );

      setError(message);
      showSnackbar(message, 'error');
    }
  };

  const handlePromptCancel = () => {
    setPromptDraft(savedPrompt);
  };

  if (settingsQuery.isLoading || (settingsQuery.isFetching && !settingsQuery.data)) {
    return (
      <section
        className={[adminComplaintsTabStyles.root, adminSystemSettingsTabStyles.root].join(' ')}
        aria-label="Настройки системы"
      >
        <div className={adminComplaintsTabStyles.top}>
          <h2 className={adminComplaintsTabStyles.title}>Настройки системы</h2>
        </div>
        <div className={adminComplaintsTabStyles.loader}>
          <Spinner />
        </div>
      </section>
    );
  }

  return (
    <div className={adminSystemSettingsTabStyles.root}>
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <section className={adminComplaintsTabStyles.root} aria-label="Настройки ревью">
        <div className={adminComplaintsTabStyles.top}>
          <h2 className={adminComplaintsTabStyles.title}>Настройки системы</h2>
        </div>

        <div className={adminSystemSettingsTabStyles.grid}>
          <label className={[adminSystemSettingsTabStyles.field, adminSystemSettingsTabStyles.deadlineField].join(' ')}>
            <span>Срок на проверку ревью</span>
            <div className={adminSystemSettingsTabStyles.numberControl}>
              <input
                type="number"
                min="1"
                max="60"
                value={reviewDeadlineDays}
                onChange={(event) => setReviewDeadlineDays(Math.max(1, Number(event.target.value) || 1))}
              />
              <span>дней</span>
            </div>
            <small>{updateDeadlineState.isLoading ? 'Сохраняем...' : `Сохранено: ${lastSavedDeadlineDays} дней`}</small>
          </label>

          <label className={[adminSystemSettingsTabStyles.field, adminSystemSettingsTabStyles.promptField].join(' ')}>
            <span>Системный промпт AI-модели</span>
            <textarea
              value={promptDraft}
              maxLength={MAX_PROMPT_LENGTH}
              onChange={(event) => setPromptDraft(event.target.value)}
            />
            <small>
              {promptDraft.length}/{MAX_PROMPT_LENGTH} символов
            </small>
          </label>
        </div>

        {hasPromptChanges && (
          <div className={adminSystemSettingsTabStyles.promptActions}>
            <button
              className={[adminSystemSettingsTabStyles.promptButton, adminSystemSettingsTabStyles.isSave].join(' ')}
              type="button"
              onClick={handlePromptSave}
              disabled={updatePromptState.isLoading || promptDraft.trim().length === 0}
              aria-label="Сохранить системный промпт"
            >
              <CheckIcon />
            </button>
            <button
              className={[adminSystemSettingsTabStyles.promptButton, adminSystemSettingsTabStyles.isCancel].join(' ')}
              type="button"
              onClick={handlePromptCancel}
              disabled={updatePromptState.isLoading}
              aria-label="Отменить изменения системного промпта"
            >
              <CrossIcon />
            </button>
          </div>
        )}

        {visibleError && <p className={adminComplaintsTabStyles.isError}>{visibleError}</p>}
      </section>

      <section className={adminComplaintsTabStyles.root} aria-label="Статистика реакций на AI-комментарии">
        <div className={adminComplaintsTabStyles.top}>
          <div>
            <h2 className={adminComplaintsTabStyles.title}>Реакции на AI-комментарии</h2>
            <p className={adminComplaintsTabStyles.subtitle}>Последние 30 дней</p>
          </div>
        </div>

        <div className={adminSystemSettingsTabStyles.stats}>
          <div className={[adminSystemSettingsTabStyles.stat, adminSystemSettingsTabStyles.isLikes].join(' ')}>
            <LikeIcon filled />
            <span>{stats?.totalLikes || 0}</span>
            <small>суммарно лайков</small>
          </div>
          <div className={[adminSystemSettingsTabStyles.stat, adminSystemSettingsTabStyles.isDislikes].join(' ')}>
            <DislikeIcon filled />
            <span>{stats?.totalDislikes || 0}</span>
            <small>суммарно дизлайков</small>
          </div>
          <div className={[adminSystemSettingsTabStyles.stat, adminSystemSettingsTabStyles.isRatio].join(' ')}>
            <div
              className={adminSystemSettingsTabStyles.ratioBar}
              aria-label={`Лайки ${likesPercent}%, дизлайки ${dislikesPercent}%`}
            >
              <span
                className={[
                  adminSystemSettingsTabStyles.ratioSegment,
                  adminSystemSettingsTabStyles.ratioSegmentLikes,
                ].join(' ')}
                style={{
                  width: `${likesPercent}%`,
                }}
              />
              <span
                className={[
                  adminSystemSettingsTabStyles.ratioSegment,
                  adminSystemSettingsTabStyles.ratioSegmentDislikes,
                ].join(' ')}
                style={{
                  width: `${dislikesPercent}%`,
                }}
              />
            </div>
            <div className={adminSystemSettingsTabStyles.ratioLegend} aria-hidden="true">
              <span
                className={[
                  adminSystemSettingsTabStyles.ratioLegendItem,
                  adminSystemSettingsTabStyles.ratioLegendItemLikes,
                ].join(' ')}
              >
                {likesPercent}% лайков
              </span>
              <span
                className={[
                  adminSystemSettingsTabStyles.ratioLegendItem,
                  adminSystemSettingsTabStyles.ratioLegendItemDislikes,
                ].join(' ')}
              >
                {dislikesPercent}% дизлайков
              </span>
            </div>
            <small>соотношение лайков и дизлайков</small>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSystemSettingsTab;

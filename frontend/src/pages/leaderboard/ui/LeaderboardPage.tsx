import { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmActionModal from '@/shared/ui/confirm-action-modal';
import EntityTabs from '@/shared/ui/entity-tabs';
import { UnwrapIcon } from '@/shared/ui/icons';
import { LeaderboardControls } from '@/widgets/leaderboard-board';
import { LeaderboardEntitySearch } from '@/widgets/leaderboard-board';
import { LeaderboardTable } from '@/widgets/leaderboard-board';
import ScrollToTopButton from '@/shared/ui/scroll-to-top-button';
import Spinner from '@/shared/ui/spinner';
import {
  LEADERBOARD_CATEGORY,
  LEADERBOARD_PERIOD,
  LEADERBOARD_SCOPE,
  LEADERBOARD_TABS,
  useGetLeaderboardQuery,
  useResetUserRatingMutation,
  useSearchLeaderboardOrganizationsQuery,
  useSearchLeaderboardProjectsQuery,
} from '@/entities/leaderboard';
import { useAuth } from '@/entities/session';
import { useDebouncedValue } from '@/shared/lib/hooks';
import leaderboardPageStyles from './LeaderboardPage.module.scss';

const getEntityConfig = (scope: LegacyValue) => {
  if (scope === LEADERBOARD_SCOPE.ORGANIZATIONS) {
    return {
      placeholder: 'Введите название организации',
      initialText: 'Выберите организацию для просмотра лидерборда',
      titleFallback: 'организации',
      emptyText: 'Вы не состоите в организациях',
      searchEmptyText: 'Организации не найдены',
    };
  }

  return {
    placeholder: 'Введите название проекта',
    initialText: 'Выберите проект для просмотра лидерборда',
    titleFallback: 'проекта',
    emptyText: 'Вы не состоите в проектах',
    searchEmptyText: 'Проекты не найдены',
  };
};

const LeaderboardPage = () => {
  const { user, userId } = useAuth();
  const currentUserId = userId || 57;
  const [activeScope, setActiveScope] = useState(LEADERBOARD_SCOPE.GLOBAL);
  const [period, setPeriod] = useState(LEADERBOARD_PERIOD.ALL_TIME);
  const [category, setCategory] = useState(LEADERBOARD_CATEGORY.OVERALL);
  const [userSearch, setUserSearch] = useState('');
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<LegacyValue>(null);
  const [shouldScrollToCurrent, setShouldScrollToCurrent] = useState(false);
  const [resetRatingUser, setResetRatingUser] = useState<LegacyValue>(null);
  const currentUserRowRef = useRef<LegacyValue>(null);
  const debouncedUserSearch = useDebouncedValue(userSearch, 300);
  const debouncedEntitySearch = useDebouncedValue(entitySearch, 300);
  const isEntityScope = activeScope !== LEADERBOARD_SCOPE.GLOBAL;
  const entityConfig = useMemo(() => getEntityConfig(activeScope), [activeScope]);
  const canResetRatings = user?.role === 'ADMIN';

  const leaderboardParams = useMemo(
    () => ({
      scope: activeScope,
      entityId: selectedEntity?.id,
      period,
      category,
      query: debouncedUserSearch,
      viewerId: currentUserId,
      page: 0,
      size: 100,
    }),
    [activeScope, category, currentUserId, debouncedUserSearch, period, selectedEntity?.id]
  );

  const entitySearchParams = useMemo(
    () => ({
      viewerId: currentUserId,
      query: debouncedEntitySearch,
      limit: 5,
      isAdmin: canResetRatings,
    }),
    [canResetRatings, currentUserId, debouncedEntitySearch]
  );

  const {
    data: leaderboard = {
      content: [],
      currentUserEntry: null,
    },
    isLoading: isLeaderboardInitialLoading,
    isFetching: isLeaderboardFetching,
  } = useGetLeaderboardQuery(leaderboardParams, {
    skip: isEntityScope && !selectedEntity,
    refetchOnMountOrArgChange: 30,
  });

  const organizationsSearchQuery = useSearchLeaderboardOrganizationsQuery(entitySearchParams, {
    skip: activeScope !== LEADERBOARD_SCOPE.ORGANIZATIONS,
    refetchOnMountOrArgChange: 60,
  });

  const projectsSearchQuery = useSearchLeaderboardProjectsQuery(entitySearchParams, {
    skip: activeScope !== LEADERBOARD_SCOPE.PROJECTS,
    refetchOnMountOrArgChange: 60,
  });

  const [resetUserRating, { isLoading: isResetRatingSubmitting }] = useResetUserRatingMutation();

  const activeEntityQuery =
    activeScope === LEADERBOARD_SCOPE.ORGANIZATIONS ? organizationsSearchQuery : projectsSearchQuery;

  const entityOptions = activeEntityQuery.data || [];
  const isEntitiesLoading = activeEntityQuery.isLoading || activeEntityQuery.isFetching;
  const isLeaderboardLoading = isLeaderboardInitialLoading || isLeaderboardFetching;

  useEffect(() => {
    if (!shouldScrollToCurrent || isLeaderboardLoading) {
      return;
    }

    currentUserRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    queueMicrotask(() => setShouldScrollToCurrent(false));
  }, [isLeaderboardLoading, leaderboard, shouldScrollToCurrent]);

  const handleScopeChange = (nextScope: LegacyValue) => {
    setActiveScope(nextScope);
    setSelectedEntity(null);
    setEntitySearch('');
    setUserSearch('');
  };

  const handleEntitySelect = (entity: LegacyValue) => {
    setSelectedEntity(entity);
    setEntitySearch(entity.name);
    setUserSearch('');
  };

  const handleMyRatingClick = () => {
    setShouldScrollToCurrent(true);
  };

  const handleResetRatingRequest = (targetUser: LegacyValue) => {
    setResetRatingUser(targetUser);
  };

  const handleResetRatingConfirm = async () => {
    if (!resetRatingUser) {
      return;
    }

    await resetUserRating(resetRatingUser.id).unwrap();
    setResetRatingUser(null);
  };

  const hasEntityMemberships = entityOptions.length > 0 || selectedEntity;
  const entityEmptyText = debouncedEntitySearch ? entityConfig.searchEmptyText : entityConfig.emptyText;

  return (
    <div className={leaderboardPageStyles.root}>
      <main className={leaderboardPageStyles.content}>
        <h1 className={leaderboardPageStyles.title}>Лидерборд</h1>

        <section className={leaderboardPageStyles.section}>
          <div className={leaderboardPageStyles.tabs}>
            <EntityTabs tabs={LEADERBOARD_TABS} activeKey={activeScope} onChange={handleScopeChange} />
          </div>

          {isEntityScope && (
            <div className={leaderboardPageStyles.block}>
              <LeaderboardEntitySearch
                value={entitySearch}
                placeholder={entityConfig.placeholder}
                options={entityOptions}
                selectedEntity={selectedEntity}
                emptyText={isEntitiesLoading ? 'Загрузка...' : entityEmptyText}
                onValueChange={(value: LegacyValue) => {
                  setEntitySearch(value);

                  if (selectedEntity && value !== selectedEntity.name) {
                    setSelectedEntity(null);
                  }
                }}
                onSelect={handleEntitySelect}
              />

              {!selectedEntity && (
                <p className={leaderboardPageStyles.message}>
                  {hasEntityMemberships || isEntitiesLoading ? entityConfig.initialText : entityConfig.emptyText}
                </p>
              )}
            </div>
          )}

          {(!isEntityScope || selectedEntity) && (
            <>
              <div className={leaderboardPageStyles.controls}>
                <LeaderboardControls
                  period={period}
                  category={category}
                  searchValue={userSearch}
                  onPeriodChange={setPeriod}
                  onCategoryChange={setCategory}
                  onSearchChange={setUserSearch}
                  onMyRatingClick={handleMyRatingClick}
                />
              </div>

              {isLeaderboardLoading ? (
                <div className={leaderboardPageStyles.loader}>
                  <Spinner />
                </div>
              ) : (
                <>
                  <div className={leaderboardPageStyles.table}>
                    <LeaderboardTable
                      ref={currentUserRowRef}
                      entries={leaderboard.content}
                      currentUserEntry={leaderboard.currentUserEntry}
                      category={category}
                      currentUserId={currentUserId}
                      canResetRatings={canResetRatings}
                      onResetRating={handleResetRatingRequest}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>

      <ScrollToTopButton />

      <ConfirmActionModal
        isOpen={Boolean(resetRatingUser)}
        title="Обнулить рейтинг пользователя?"
        description={`Рейтинг пользователя ${resetRatingUser?.name || resetRatingUser?.login || ''} будет обнулен. Это действие повлияет на его позиции во всех лидербордах.`}
        confirmLabel="Обнулить"
        onCancel={() => setResetRatingUser(null)}
        onConfirm={handleResetRatingConfirm}
        isSubmitting={isResetRatingSubmitting}
        isDeleteAction
      />
    </div>
  );
};

export default LeaderboardPage;

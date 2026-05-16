import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmActionModal from '../../components/ConfirmActionModal/ConfirmActionModal';
import EntityTabs from '../../components/EntityTabs/EntityTabs';
import Header from '../../components/Header/Header';
import { UnwrapIcon } from '../../components/Icons/Icons';
import LeaderboardControls from '../../components/LeaderboardControls/LeaderboardControls';
import LeaderboardEntitySearch from '../../components/LeaderboardEntitySearch/LeaderboardEntitySearch';
import LeaderboardTable from '../../components/LeaderboardTable/LeaderboardTable';
import ScrollToTopButton from '../../components/ScrollToTopButton/ScrollToTopButton';
import Spinner from '../../components/Spinner/Spinner';
import { leaderboardApi } from '../../api/leaderboardApi';
import {
  LEADERBOARD_CATEGORY,
  LEADERBOARD_PERIOD,
  LEADERBOARD_SCOPE,
  LEADERBOARD_TABS
} from '../../constants/leaderboard';
import { useAuth } from '../../hooks/useAuth';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import './LeaderboardPage.css';

const getEntityConfig = (scope) => {
  if (scope === LEADERBOARD_SCOPE.ORGANIZATIONS) {
    return {
      placeholder: 'Введите название организации',
      initialText: 'Выберите организацию для просмотра лидерборда',
      titleFallback: 'организации',
      emptyText: 'Вы не состоите в организациях',
      searchEmptyText: 'Организации не найдены'
    };
  }

  return {
    placeholder: 'Введите название проекта',
    initialText: 'Выберите проект для просмотра лидерборда',
    titleFallback: 'проекта',
    emptyText: 'Вы не состоите в проектах',
    searchEmptyText: 'Проекты не найдены'
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
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityOptions, setEntityOptions] = useState([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [isEntitiesLoading, setIsEntitiesLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState({ content: [], currentUserEntry: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [shouldScrollToCurrent, setShouldScrollToCurrent] = useState(false);
  const [resetRatingUser, setResetRatingUser] = useState(null);
  const [isResetRatingSubmitting, setIsResetRatingSubmitting] = useState(false);
  const currentUserRowRef = useRef(null);
  const debouncedUserSearch = useDebouncedValue(userSearch, 300);
  const debouncedEntitySearch = useDebouncedValue(entitySearch, 300);
  const isEntityScope = activeScope !== LEADERBOARD_SCOPE.GLOBAL;
  const entityConfig = useMemo(() => getEntityConfig(activeScope), [activeScope]);
  const canResetRatings = user?.role === 'ADMIN';

  const loadLeaderboard = useCallback(async () => {
    if (isEntityScope && !selectedEntity) {
      setLeaderboard({ content: [], currentUserEntry: null });
      setIsLeaderboardLoading(false);
      return;
    }

    setIsLeaderboardLoading(true);

    try {
      const result = await leaderboardApi.getLeaderboard({
        scope: activeScope,
        entityId: selectedEntity?.id,
        period,
        category,
        query: debouncedUserSearch,
        viewerId: currentUserId,
        page: 0,
        size: 100
      });

      setLeaderboard(result);
    } finally {
      setIsLeaderboardLoading(false);
    }
  }, [activeScope, category, currentUserId, debouncedUserSearch, isEntityScope, period, selectedEntity]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, reloadKey]);

  useEffect(() => {
    if (!isEntityScope) {
      return undefined;
    }

    let isMounted = true;

    const loadEntities = async () => {
      setIsEntitiesLoading(true);

      try {
        const result = activeScope === LEADERBOARD_SCOPE.ORGANIZATIONS
          ? await leaderboardApi.searchOrganizations({ viewerId: currentUserId, query: debouncedEntitySearch, limit: 5, isAdmin: canResetRatings })
          : await leaderboardApi.searchProjects({ viewerId: currentUserId, query: debouncedEntitySearch, limit: 5, isAdmin: canResetRatings });

        if (isMounted) {
          setEntityOptions(result);
        }
      } finally {
        if (isMounted) {
          setIsEntitiesLoading(false);
        }
      }
    };

    loadEntities();

    return () => {
      isMounted = false;
    };
  }, [activeScope, canResetRatings, currentUserId, debouncedEntitySearch, isEntityScope]);

  useEffect(() => {
    if (!shouldScrollToCurrent || isLeaderboardLoading) {
      return;
    }

    currentUserRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShouldScrollToCurrent(false);
  }, [isLeaderboardLoading, leaderboard, shouldScrollToCurrent]);

  const handleScopeChange = (nextScope) => {
    setActiveScope(nextScope);
    setSelectedEntity(null);
    setEntitySearch('');
    setUserSearch('');
    setLeaderboard({ content: [], currentUserEntry: null });
  };

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    setEntitySearch(entity.name);
    setUserSearch('');
  };

  const handleMyRatingClick = () => {
    setShouldScrollToCurrent(true);
  };

  const handleResetRatingRequest = (targetUser) => {
    setResetRatingUser(targetUser);
  };

  const handleResetRatingConfirm = async () => {
    if (!resetRatingUser) {
      return;
    }

    setIsResetRatingSubmitting(true);

    try {
      await leaderboardApi.resetUserRating(resetRatingUser.id);
      setReloadKey((value) => value + 1);
      setResetRatingUser(null);
    } finally {
      setIsResetRatingSubmitting(false);
    }
  };

  const hasEntityMemberships = entityOptions.length > 0 || selectedEntity;
  const entityEmptyText = debouncedEntitySearch ? entityConfig.searchEmptyText : entityConfig.emptyText;

  return (
    <div className="leaderboard-page">
      <Header />

      <main className="leaderboard-page__content">
        <h1 className="leaderboard-page__title">Лидерборд</h1>

        <section className="leaderboard-page__section">
          <div className="leaderboard-page__tabs">
            <EntityTabs tabs={LEADERBOARD_TABS} activeKey={activeScope} onChange={handleScopeChange} />
          </div>

          {isEntityScope && (
            <div className="leaderboard-page__entity-block">
              <LeaderboardEntitySearch
                value={entitySearch}
                placeholder={entityConfig.placeholder}
                options={entityOptions}
                selectedEntity={selectedEntity}
                emptyText={isEntitiesLoading ? 'Загрузка...' : entityEmptyText}
                onValueChange={(value) => {
                  setEntitySearch(value);
                  if (selectedEntity && value !== selectedEntity.name) {
                    setSelectedEntity(null);
                  }
                }}
                onSelect={handleEntitySelect}
              />

              {!selectedEntity && (
                <p className="leaderboard-page__entity-message">
                  {hasEntityMemberships || isEntitiesLoading ? entityConfig.initialText : entityConfig.emptyText}
                </p>
              )}
            </div>
          )}

          {(!isEntityScope || selectedEntity) && (
            <>
              <div className="leaderboard-page__controls">
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
                <div className="leaderboard-page__loader">
                  <Spinner />
                </div>
              ) : (
                <>
                  <div className="leaderboard-page__table">
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

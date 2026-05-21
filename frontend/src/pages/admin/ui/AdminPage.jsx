import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { AdminUsersTab } from '@/features/manage-users';
import { AdminComplaintsTab, AdminEventsLogTab, AdminSystemSettingsTab } from '@/features/manage-admin';
import { fetchCurrentUser, logoutUser } from '@/entities/session';
import adminPageStyles from './AdminPage.module.scss';

const TABS = [
  {
    key: 'users',
    label: 'Пользователи',
  },
  {
    key: 'complaints',
    label: 'Жалобы',
  },
  {
    key: 'settings',
    label: 'Настройки системы',
  },
  {
    key: 'events',
    label: 'Журнал событий',
  },
];

const AdminPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((tab) => tab.key === requestedTab) ? requestedTab : TABS[0].key;
  const currentUserId = user?.id ?? null;

  const moderator = useMemo(
    () => ({
      id: user?.id ?? null,
      login: user?.login || 'admin',
      fullName: user?.fullName || user?.name || user?.login || 'Администратор',
    }),
    [user?.fullName, user?.id, user?.login, user?.name]
  );

  const handleLogout = async () => {
    await dispatch(logoutUser());

    navigate(ROUTES.login, {
      replace: true,
    });
  };

  const handleSelfDemote = async () => {
    await dispatch(fetchCurrentUser());

    navigate(ROUTES.dashboard, {
      replace: true,
    });
  };

  const handleSelfDelete = async () => {
    await dispatch(logoutUser());

    navigate(ROUTES.login, {
      replace: true,
    });
  };

  const handleTabChange = (tabKey) => {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set('tab', tabKey);

        return nextParams;
      },
      {
        replace: true,
      }
    );
  };

  return (
    <div className={adminPageStyles.root}>
      <header className={adminPageStyles.adminHeader}>
        <div className={adminPageStyles.titleBlock}>
          <h1 className={adminPageStyles.title}>Админ-панель</h1>
          <nav className={adminPageStyles.adminTabs} aria-label="Вкладки админ-панели">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={[adminPageStyles.button, activeTab === tab.key ? adminPageStyles.isActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className={adminPageStyles.actions}>
          <ThemeToggle />
          <div className={adminPageStyles.linksContainer}>
            <Link className={adminPageStyles.link} to={ROUTES.dashboard}>
              На главную
            </Link>
            <button className={adminPageStyles.logout} type="button" onClick={handleLogout} disabled={isLoading}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className={adminPageStyles.content}>
        {activeTab === 'users' && (
          <AdminUsersTab
            isActive={activeTab === 'users'}
            currentUserId={currentUserId}
            onSelfDemote={handleSelfDemote}
            onSelfDelete={handleSelfDelete}
          />
        )}
        {activeTab === 'complaints' && (
          <AdminComplaintsTab isActive={activeTab === 'complaints'} moderator={moderator} />
        )}
        {activeTab === 'settings' && <AdminSystemSettingsTab isActive={activeTab === 'settings'} actor={moderator} />}
        {activeTab === 'events' && <AdminEventsLogTab isActive={activeTab === 'events'} />}
      </main>
    </div>
  );
};

export default AdminPage;

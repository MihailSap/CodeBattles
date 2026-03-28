import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import AdminUsersTab from '../../components/AdminUsersTab/AdminUsersTab';
import { fetchCurrentUser, logoutUser } from '../../store/slices/authSlice';
import './AdminPage.css';

const TABS = [
    {
        key: 'users',
        label: 'Пользователи'
    }
];

const AdminPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS[0].key);
    const currentUserId = user?.id ?? null;

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate(ROUTES.login, { replace: true });
    };

    const handleSelfDemote = async () => {
        await dispatch(fetchCurrentUser());
        navigate(ROUTES.home, { replace: true });
    };

    const handleSelfDelete = async () => {
        await dispatch(logoutUser());
        navigate(ROUTES.login, { replace: true });
    };

    return (
        <div className="admin-page">
            <header className="admin-header">
                <div className="admin-header__title-block">
                    <h1 className="admin-header__title">Админ-панель</h1>
                    <nav className="admin-tabs" aria-label="Вкладки админ-панели">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`admin-tabs__button ${activeTab === tab.key ? 'admin-tabs__button--active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="admin-header__actions">
                    <ThemeToggle />
                    <div className='admin-header__links-container'>
                        <Link className="admin-header__link" to={ROUTES.home}>
                            На главную
                        </Link>
                        <button className="admin-header__logout" type="button" onClick={handleLogout} disabled={isLoading}>
                            Выйти
                        </button>
                    </div>
                </div>
            </header>

            <main className="admin-content">
                {activeTab === 'users' && (
                    <AdminUsersTab
                        isActive={activeTab === 'users'}
                        currentUserId={currentUserId}
                        onSelfDemote={handleSelfDemote}
                        onSelfDelete={handleSelfDelete}
                    />
                )}
            </main>
        </div>
    );
};

export default AdminPage;

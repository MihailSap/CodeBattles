import Header from '../../components/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import './MainPage.css';

const MainPage = () => {
  const { user } = useAuth();

  return (
    <div className="main-page">
      <Header />

      <div className="main-page__card">
        <h1 className="main-page__title">Главная страница</h1>
        <p className="main-page__text">Email: {user?.email || '—'}</p>
        <p className="main-page__text">Логин: {user?.login || '—'}</p>
      </div>
    </div>
  );
};

export default MainPage;

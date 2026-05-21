import Spinner from '@/shared/ui/spinner';
import { useAuth } from '@/entities/session';
import mainPageStyles from './MainPage.module.scss';

const MainPage = () => {
  const { user } = useAuth();

  return (
    <div className={mainPageStyles.root}>
      <div className={mainPageStyles.card}>
        <h1 className={mainPageStyles.title}>Главная страница</h1>
        <p className={mainPageStyles.text}>Email: {user?.email || '—'}</p>
        <p className={mainPageStyles.text}>Логин: {user?.login || '—'}</p>
      </div>
    </div>
  );
};

export default MainPage;

import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import './RecoveryPage.css';

const RecoveryPage = () => {
  return (
    <div className="recovery-page">
      <div className="recovery-page__card">
        <h1 className="recovery-page__title">Восстановление пароля</h1>
        <p className="recovery-page__text">Страница-заглушка. Функция будет добавлена позже.</p>
        <Link className="recovery-page__link" to={ROUTES.login}>
          Вернуться ко входу
        </Link>
      </div>
    </div>
  );
};

export default RecoveryPage;

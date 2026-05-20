import { Link } from 'react-router-dom';
import logoDark from '@/shared/assets/logo-dark.svg?url';
import logoLight from '@/shared/assets/logo-light.svg?url';
import { ROUTES } from '@/shared/config/routes';
import { useTheme } from '@/shared/lib/theme';

const LandingHeader = () => {
  const { theme } = useTheme();

  return (
    <header className="landing-header">
      <div className="landing-header__content">
        <Link className="landing-header__logo-link" to={ROUTES.home} aria-label="CodeBattles">
          <img className="landing-header__logo" src={theme === 'dark' ? logoDark : logoLight} alt="CodeBattles" />
        </Link>

        <nav className="landing-header__nav" aria-label="Авторизация">
          <Link className="landing-header__link" to={ROUTES.login}>
            Вход
          </Link>
          <Link className="landing-header__link landing-header__link--primary" to={ROUTES.register}>
            Регистрация
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;

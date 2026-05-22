import { Link } from 'react-router-dom';
import logoDark from '@/shared/assets/logo-dark.svg?url';
import logoLight from '@/shared/assets/logo-light.svg?url';
import { ROUTES } from '@/shared/config/routes';
import { useTheme } from '@/shared/lib/theme';
import landingPageStyles from './LandingPage.module.scss';

const LandingHeader = () => {
  const { theme } = useTheme();

  return (
    <header className={landingPageStyles.root}>
      <div className={landingPageStyles.content}>
        <Link className={landingPageStyles.logoLink} to={ROUTES.home} aria-label="CodeBattles">
          <img className={landingPageStyles.logo} src={theme === 'dark' ? logoDark : logoLight} alt="CodeBattles" />
        </Link>

        <nav className={landingPageStyles.nav} aria-label="Авторизация">
          <Link className={landingPageStyles.link} to={ROUTES.login}>
            Вход
          </Link>
          <Link className={[landingPageStyles.link, landingPageStyles.isPrimary].join(' ')} to={ROUTES.register}>
            Регистрация
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;

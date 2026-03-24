import { useTheme } from '../ThemeProvider';
import { MoonIcon, SunIcon } from '../Icons/Icons';
import './ThemeToggle.css';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className={`theme-toggle ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'}`}
      onClick={toggleTheme}
      type="button"
      aria-label="Сменить тему"
    >
      <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
        <SunIcon />
      </span>
      <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
        <MoonIcon />
      </span>
      <span className="theme-toggle__thumb" aria-hidden="true" />
    </button>
  );
};

import { useTheme } from '@/shared/lib/theme';
import { MoonIcon, SunIcon } from '@/shared/ui/icons';
import themeToggleStyles from './ThemeToggle.module.scss';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className={[themeToggleStyles.root, isDark ? themeToggleStyles.isDark : themeToggleStyles.isLight]
        .filter(Boolean)
        .join(' ')}
      onClick={toggleTheme}
      type="button"
      aria-label="Сменить тему"
    >
      <span className={[themeToggleStyles.icon, themeToggleStyles.isSun].join(' ')} aria-hidden="true">
        <SunIcon />
      </span>
      <span className={[themeToggleStyles.icon, themeToggleStyles.isMoon].join(' ')} aria-hidden="true">
        <MoonIcon />
      </span>
      <span className={themeToggleStyles.thumb} aria-hidden="true" />
    </button>
  );
};

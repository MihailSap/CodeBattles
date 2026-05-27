import type { CodeEditorThemePreference } from '@/shared/lib/theme';
import { MoonIcon, RefreshCycleIcon, SunIcon } from '@/shared/ui/icons';
import codeToolbarStyles from './CodeToolbar.module.scss';

const THEME_MODES = [
  {
    value: 'light',
    label: 'Светлая тема редактора',
    icon: <SunIcon />,
  },
  {
    value: 'system',
    label: 'Тема редактора как на сайте',
    icon: <RefreshCycleIcon />,
  },
  {
    value: 'dark',
    label: 'Темная тема редактора',
    icon: <MoonIcon />,
  },
] as const;

interface CodeThemeSwitchProps {
  value: CodeEditorThemePreference;
  onChange: (theme: CodeEditorThemePreference) => void;
}

const CodeThemeSwitch = ({ value, onChange }: CodeThemeSwitchProps) => (
  <div className={codeToolbarStyles.switch} role="group" aria-label="Тема редактора">
    <span
      className={[
        codeToolbarStyles.thumb,
        value === 'system' ? codeToolbarStyles.isSystem : '',
        value === 'dark' ? codeToolbarStyles.isDark : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    />
    {THEME_MODES.map((mode) => (
      <button
        key={mode.value}
        className={[codeToolbarStyles.option, value === mode.value ? codeToolbarStyles.isActive : '']
          .filter(Boolean)
          .join(' ')}
        type="button"
        title={mode.label}
        aria-label={mode.label}
        aria-pressed={value === mode.value}
        onClick={() => onChange(mode.value)}
      >
        {mode.icon}
      </button>
    ))}
  </div>
);

export default CodeThemeSwitch;

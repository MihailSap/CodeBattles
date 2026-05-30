import type { CodeEditorThemePreference } from '@/shared/lib/theme';
import CodeThemeSwitch from './CodeThemeSwitch';
import codeToolbarStyles from './CodeToolbar.module.scss';

const MAX_VISIBLE_PATH_LENGTH = 72;

interface CodeToolbarProps {
  filePath: string;
  themePreference: CodeEditorThemePreference;
  onThemePreferenceChange: (theme: CodeEditorThemePreference) => void;
}

const truncateLeadingPath = (path: string): string =>
  path.length > MAX_VISIBLE_PATH_LENGTH ? `...${path.slice(-(MAX_VISIBLE_PATH_LENGTH - 3))}` : path;

const CodeToolbar = ({ filePath, themePreference, onThemePreferenceChange }: CodeToolbarProps) => (
  <div className={codeToolbarStyles.root}>
    <span className={codeToolbarStyles.path} title={filePath}>
      {truncateLeadingPath(filePath)}
    </span>
    <CodeThemeSwitch value={themePreference} onChange={onThemePreferenceChange} />
  </div>
);

export default CodeToolbar;

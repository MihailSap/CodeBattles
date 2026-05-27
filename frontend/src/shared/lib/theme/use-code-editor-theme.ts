import { useCallback, useEffect, useState } from 'react';
import { useTheme } from './theme-provider';

const STORAGE_KEY = 'code-editor-theme';
const CHANGE_EVENT = 'code-editor-theme-change';

export type CodeEditorThemePreference = 'system' | 'light' | 'dark';
export type MonacoEditorTheme = 'light' | 'vs-dark';

interface CodeEditorThemeState {
  preference: CodeEditorThemePreference;
  monacoTheme: MonacoEditorTheme;
  setPreference: (preference: CodeEditorThemePreference) => void;
}

const getStoredPreference = (): CodeEditorThemePreference => {
  const savedPreference = localStorage.getItem(STORAGE_KEY);

  if (savedPreference === 'light' || savedPreference === 'dark') {
    return savedPreference;
  }

  return 'system';
};

export const useCodeEditorTheme = (): CodeEditorThemeState => {
  const { theme } = useTheme();
  const [preference, setPreferenceState] = useState<CodeEditorThemePreference>(getStoredPreference);

  useEffect(() => {
    const updatePreference = () => {
      setPreferenceState(getStoredPreference());
    };

    window.addEventListener(CHANGE_EVENT, updatePreference);
    window.addEventListener('storage', updatePreference);

    return () => {
      window.removeEventListener(CHANGE_EVENT, updatePreference);
      window.removeEventListener('storage', updatePreference);
    };
  }, []);

  const setPreference = useCallback((nextPreference: CodeEditorThemePreference) => {
    if (nextPreference === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, nextPreference);
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const effectiveTheme = preference === 'system' ? theme : preference;

  return {
    preference,
    monacoTheme: effectiveTheme === 'dark' ? 'vs-dark' : 'light',
    setPreference,
  };
};

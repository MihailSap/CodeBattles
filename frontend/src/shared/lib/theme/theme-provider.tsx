/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useContext, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import { selectTheme, toggleTheme } from './model/theme-slice';

const ThemeContext = createContext<LegacyValue>({});

export const ThemeProvider = ({ children }: LegacyValue) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => dispatch(toggleTheme()),
    }),
    [dispatch, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

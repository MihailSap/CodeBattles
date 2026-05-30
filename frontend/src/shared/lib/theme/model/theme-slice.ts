import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/providers/store';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  value: ThemeMode;
}

const getSystemTheme = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return getSystemTheme();
};

const initialState: ThemeState = {
  value: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.value = action.payload;
    },
    toggleTheme(state) {
      state.value = state.value === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export const selectTheme = (state: RootState): ThemeMode => state.theme.value;
export default themeSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
const getSystemTheme = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return getSystemTheme();
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    value: getInitialTheme(),
  },
  reducers: {
    setTheme(state, action) {
      state.value = action.payload;
    },
    toggleTheme(state) {
      state.value = state.value === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export const selectTheme = (state) => state.theme.value;
export default themeSlice.reducer;

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import { userApi } from '../../api/userApi';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { tokenStorage } from '../../utils/tokenStorage';

const EMPTY_USER = {
  id: null,
  email: '',
  login: '',
  role: null,
  enabled: false
};

const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    return { ...EMPTY_USER };
  }

  return {
    ...EMPTY_USER,
    ...user
  };
};

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await userApi.getCurrentUser();

    return response.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось получить данные пользователя', 'currentUser'));
  }
});

export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { dispatch, rejectWithValue }) => {
  const accessToken = tokenStorage.getAccessToken();
  const refreshToken = tokenStorage.getRefreshToken();

  if (!accessToken && !refreshToken) {
    return { user: normalizeUser(), userId: null, isAuthenticated: false };
  }

  try {
    const user = await dispatch(fetchCurrentUser()).unwrap();

    return {
      user: normalizeUser(user),
      userId: user?.id ?? null,
      isAuthenticated: true
    };
  } catch (errorMessage) {
    tokenStorage.clearTokens();

    return rejectWithValue(errorMessage || 'Сессия недействительна, войдите снова');
  }
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await authApi.login(payload);

    tokenStorage.setTokens(response.data);

    const user = await dispatch(fetchCurrentUser()).unwrap();

    return {
      user: normalizeUser(user),
      userId: user?.id ?? null,
      tokens: response.data
    };
  } catch (error) {
    tokenStorage.clearTokens();

    return rejectWithValue(getApiErrorMessage(error, 'Ошибка входа', 'login'));
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (payload, { rejectWithValue }) => {
  try {
    await authApi.register(payload);
    tokenStorage.clearTokens();

    return null;
  } catch (error) {
    tokenStorage.clearTokens();

    return rejectWithValue(getApiErrorMessage(error, 'Ошибка регистрации', 'register'));
  }
});

export const verifyEmailUser = createAsyncThunk('auth/verifyEmailUser', async (token, { dispatch, rejectWithValue }) => {
  try {
    const response = await authApi.verifyEmail(token);

    tokenStorage.setTokens(response.data);

    const user = await dispatch(fetchCurrentUser()).unwrap();

    return {
      user: normalizeUser(user),
      userId: user?.id ?? null,
      tokens: response.data
    };
  } catch (error) {
    tokenStorage.clearTokens();

    return rejectWithValue(getApiErrorMessage(error, 'Не удалось подтвердить почту', 'verifyEmail'));
  }
});

export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async (email, { rejectWithValue }) => {
  try {
    const response = await authApi.forgotPassword(email);

    return response.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось отправить ссылку для сброса пароля', 'forgotPassword'));
  }
});

export const resetPasswordByToken = createAsyncThunk('auth/resetPasswordByToken', async (payload, { rejectWithValue }) => {
  try {
    const response = await authApi.resetPassword(payload);

    return response.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось изменить пароль', 'resetPassword'));
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  const accessToken = tokenStorage.getAccessToken();

  try {
    if (refreshToken && accessToken) {
      await authApi.logout(refreshToken, accessToken);
    }
  } finally {
    tokenStorage.clearTokens();
  }

  return null;
});

export const updateUserLogin = createAsyncThunk('auth/updateUserLogin', async (newLogin, { getState, rejectWithValue }) => {
  const { userId } = getState().auth;

  if (!userId && userId !== 0) {
    return rejectWithValue('Не удалось определить ID пользователя');
  }

  try {
    const response = await userApi.updateLogin(userId, newLogin);

    return response.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось обновить логин', 'updateLogin'));
  }
});

export const updateUserPassword = createAsyncThunk('auth/updateUserPassword', async (newPassword, { getState, rejectWithValue }) => {
  const { userId } = getState().auth;

  if (!userId && userId !== 0) {
    return rejectWithValue('Не удалось определить ID пользователя');
  }

  try {
    const response = await userApi.updatePassword(userId, newPassword);

    return response.data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось обновить пароль', 'updatePassword'));
  }
});

const initialState = {
  user: normalizeUser(),
  userId: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,
  successMessage: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthMessages(state) {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.error = action.payload || 'Сессия недействительна';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
        state.successMessage = 'Вы успешно вошли в аккаунт';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка входа';
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.successMessage = 'Письмо с подтверждением отправлено';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка регистрации';
      })
      .addCase(verifyEmailUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyEmailUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
        state.successMessage = 'Почта успешно подтверждена';
      })
      .addCase(verifyEmailUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось подтвердить почту';
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = typeof action.payload === 'string' ? action.payload : 'Ссылка для сброса отправлена';
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось отправить ссылку для сброса пароля';
      })
      .addCase(resetPasswordByToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPasswordByToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = typeof action.payload === 'string' ? action.payload : 'Пароль изменен';
      })
      .addCase(resetPasswordByToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось изменить пароль';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = normalizeUser(action.payload);
        state.isAuthenticated = true;
        state.userId = action.payload?.id ?? state.userId;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.error = action.payload || 'Не удалось получить пользователя';
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.successMessage = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
      })
      .addCase(updateUserLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUserLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = normalizeUser(action.payload);
        state.userId = action.payload?.id ?? state.userId;
        state.successMessage = 'Логин успешно обновлен';
      })
      .addCase(updateUserLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось обновить логин';
      })
      .addCase(updateUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUserPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = typeof action.payload === 'string' ? action.payload : 'Пароль обновлен';
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось обновить пароль';
      });
  }
});

export const { clearAuthMessages } = authSlice.actions;

export default authSlice.reducer;

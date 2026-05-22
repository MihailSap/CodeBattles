import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/auth-api';
import { userApi } from '@/entities/user';
import { getApiErrorMessage } from '@/shared/lib';
import { tokenStorage } from '@/shared/lib';

const createLegacyAsyncThunk: LegacyValue = createAsyncThunk;

const EMPTY_USER = {
  id: null,
  name: '',
  email: '',
  login: '',
  registeredAt: '',
  avatarPath: '',
  role: null,
  enabled: false,
};

const normalizeUser = (user: LegacyValue = null) => {
  if (!user || typeof user !== 'object') {
    return {
      ...EMPTY_USER,
    };
  }

  return {
    ...EMPTY_USER,
    ...user,
  };
};

export const fetchCurrentUser = createLegacyAsyncThunk(
  'auth/fetchCurrentUser',
  async (_: LegacyValue, { rejectWithValue }: LegacyValue) => {
    try {
      const user = await userApi.getCurrentUser();

      return user;
    } catch (error: LegacyValue) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось получить данные пользователя', 'currentUser'));
    }
  }
);
export const initializeAuth = createLegacyAsyncThunk(
  'auth/initialize',
  async (_: LegacyValue, { dispatch, rejectWithValue }: LegacyValue) => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (!accessToken && !refreshToken) {
      return {
        user: normalizeUser(),
        userId: null,
        isAuthenticated: false,
      };
    }

    try {
      const user = await dispatch(fetchCurrentUser()).unwrap();

      return {
        user: normalizeUser(user),
        userId: user?.id ?? null,
        isAuthenticated: true,
      };
    } catch (errorMessage: LegacyValue) {
      tokenStorage.clearTokens();

      return rejectWithValue(errorMessage || 'Сессия недействительна, войдите снова');
    }
  }
);
export const loginUser = createLegacyAsyncThunk(
  'auth/loginUser',
  async (payload: LegacyValue, { dispatch, rejectWithValue }: LegacyValue) => {
    try {
      const response = await authApi.login(payload);
      tokenStorage.setTokens(response.data);
      const user = await dispatch(fetchCurrentUser()).unwrap();

      return {
        user: normalizeUser(user),
        userId: user?.id ?? null,
        tokens: response.data,
      };
    } catch (error: LegacyValue) {
      tokenStorage.clearTokens();

      return rejectWithValue(getApiErrorMessage(error, 'Ошибка входа', 'login'));
    }
  }
);
export const registerUser = createLegacyAsyncThunk(
  'auth/registerUser',
  async (payload: LegacyValue, { rejectWithValue }: LegacyValue) => {
    try {
      await authApi.register(payload);
      tokenStorage.clearTokens();

      return null;
    } catch (error: LegacyValue) {
      tokenStorage.clearTokens();

      return rejectWithValue(getApiErrorMessage(error, 'Ошибка регистрации', 'register'));
    }
  }
);
export const verifyEmailUser = createLegacyAsyncThunk(
  'auth/verifyEmailUser',
  async (token: LegacyValue, { dispatch, rejectWithValue }: LegacyValue) => {
    try {
      const response = await authApi.verifyEmail(token);
      tokenStorage.setTokens(response.data);
      const user = await dispatch(fetchCurrentUser()).unwrap();

      return {
        user: normalizeUser(user),
        userId: user?.id ?? null,
        tokens: response.data,
      };
    } catch (error: LegacyValue) {
      tokenStorage.clearTokens();

      return rejectWithValue(getApiErrorMessage(error, 'Не удалось подтвердить почту', 'verifyEmail'));
    }
  }
);
export const requestPasswordReset = createLegacyAsyncThunk(
  'auth/requestPasswordReset',
  async (email: LegacyValue, { rejectWithValue }: LegacyValue) => {
    try {
      const response = await authApi.forgotPassword(email);

      return response.data;
    } catch (error: LegacyValue) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Не удалось отправить ссылку для сброса пароля', 'forgotPassword')
      );
    }
  }
);
export const resetPasswordByToken = createLegacyAsyncThunk(
  'auth/resetPasswordByToken',
  async (payload: LegacyValue, { rejectWithValue }: LegacyValue) => {
    try {
      const response = await authApi.resetPassword(payload);

      return response.data;
    } catch (error: LegacyValue) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось изменить пароль', 'resetPassword'));
    }
  }
);
export const logoutUser = createLegacyAsyncThunk('auth/logoutUser', async () => {
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
export const updateUserLogin = createLegacyAsyncThunk(
  'auth/updateUserLogin',
  async (newLogin: LegacyValue, { getState, rejectWithValue }: LegacyValue) => {
    const { userId } = getState().auth;

    if (!userId && userId !== 0) {
      return rejectWithValue('Не удалось определить ID пользователя');
    }

    try {
      const response = await userApi.updateLogin(userId, newLogin);

      return response.data;
    } catch (error: LegacyValue) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось обновить логин', 'updateLogin'));
    }
  }
);
export const updateUserPassword = createLegacyAsyncThunk(
  'auth/updateUserPassword',
  async (newPassword: LegacyValue, { getState, rejectWithValue }: LegacyValue) => {
    const { userId } = getState().auth;

    if (!userId && userId !== 0) {
      return rejectWithValue('Не удалось определить ID пользователя');
    }

    try {
      const response = await userApi.updatePassword(userId, newPassword);

      return response.data;
    } catch (error: LegacyValue) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось обновить пароль', 'updatePassword'));
    }
  }
);

const initialState = {
  user: normalizeUser(),
  userId: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthMessages(state: LegacyValue) {
      state.error = null;
      state.successMessage = null;
    },
    patchAuthUser(state: LegacyValue, action: LegacyValue) {
      state.user = normalizeUser({
        ...state.user,
        ...action.payload,
      });
    },
  },
  extraReducers: (builder: LegacyValue) => {
    builder
      .addCase(initializeAuth.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
      })
      .addCase(initializeAuth.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.error = action.payload || 'Сессия недействительна';
      })
      .addCase(loginUser.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
        state.successMessage = 'Вы успешно вошли в аккаунт';
      })
      .addCase(loginUser.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка входа';
      })
      .addCase(registerUser.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state: LegacyValue) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.successMessage = 'Письмо с подтверждением отправлено';
      })
      .addCase(registerUser.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка регистрации';
      })
      .addCase(verifyEmailUser.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyEmailUser.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
        state.successMessage = 'Почта успешно подтверждена';
      })
      .addCase(verifyEmailUser.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось подтвердить почту';
      })
      .addCase(requestPasswordReset.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.successMessage = typeof action.payload === 'string' ? action.payload : 'Ссылка для сброса отправлена';
      })
      .addCase(requestPasswordReset.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось отправить ссылку для сброса пароля';
      })
      .addCase(resetPasswordByToken.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPasswordByToken.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.successMessage = typeof action.payload === 'string' ? action.payload : 'Пароль изменен';
      })
      .addCase(resetPasswordByToken.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось изменить пароль';
      })
      .addCase(fetchCurrentUser.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.user = normalizeUser(action.payload);
        state.isAuthenticated = true;
        state.userId = action.payload?.id ?? state.userId;
      })
      .addCase(fetchCurrentUser.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.error = action.payload || 'Не удалось получить пользователя';
      })
      .addCase(logoutUser.pending, (state: LegacyValue) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state: LegacyValue) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.successMessage = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state: LegacyValue) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
      })
      .addCase(updateUserLogin.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUserLogin.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.user = normalizeUser(action.payload);
        state.userId = action.payload?.id ?? state.userId;
        state.successMessage = 'Логин успешно обновлен';
      })
      .addCase(updateUserLogin.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось обновить логин';
      })
      .addCase(updateUserPassword.pending, (state: LegacyValue) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUserPassword.fulfilled, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.successMessage = typeof action.payload === 'string' ? action.payload : 'Пароль обновлен';
      })
      .addCase(updateUserPassword.rejected, (state: LegacyValue, action: LegacyValue) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось обновить пароль';
      });
  },
});

export const { clearAuthMessages, patchAuthUser } = authSlice.actions;
export default authSlice.reducer;

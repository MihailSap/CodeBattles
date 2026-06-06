import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/auth-api';
import { userApi } from '@/entities/user';
import { baseApi } from '@/shared/api';
import { getApiErrorMessage } from '@/shared/lib';
import { tokenStorage } from '@/shared/lib';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/providers/store';
import type { User } from '@/entities/user';
import type { AuthState, LoginPayload, RegisterPayload, ResetPasswordPayload } from './types';

interface AuthResultPayload {
  user: User;
  userId: number | null;
}

interface InitializeAuthPayload extends AuthResultPayload {
  isAuthenticated: boolean;
}

interface AuthThunkConfig {
  state: RootState;
  rejectValue: string;
}

const createAppAsyncThunk = createAsyncThunk.withTypes<AuthThunkConfig>();

const EMPTY_USER: User = {
  id: 0,
  name: '',
  email: '',
  login: '',
  registeredAt: '',
  avatarPath: '',
  role: null,
  enabled: false,
};

const normalizeUser = (user: User | Partial<User> | null = null): User => {
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

export const fetchCurrentUser = createAppAsyncThunk<User | null, void>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await userApi.getCurrentUser();

      return user;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось получить данные пользователя', 'currentUser'));
    }
  }
);

export const initializeAuth = createAppAsyncThunk<InitializeAuthPayload, void>(
  'auth/initialize',
  async (_, { dispatch, rejectWithValue }) => {
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
    } catch (errorMessage: unknown) {
      tokenStorage.clearTokens();

      return rejectWithValue(typeof errorMessage === 'string' ? errorMessage : 'Сессия недействительна, войдите снова');
    }
  }
);

export const loginUser = createAppAsyncThunk<AuthResultPayload, LoginPayload>(
  'auth/loginUser',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await authApi.login(payload);
      tokenStorage.setTokens(response.data);
      const user = await dispatch(fetchCurrentUser()).unwrap();

      return {
        user: normalizeUser(user),
        userId: user?.id ?? null,
      };
    } catch (error: unknown) {
      tokenStorage.clearTokens();

      return rejectWithValue(getApiErrorMessage(error, 'Ошибка входа', 'login'));
    }
  }
);

export const registerUser = createAppAsyncThunk<null, RegisterPayload>(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      await authApi.register(payload);
      tokenStorage.clearTokens();

      return null;
    } catch (error: unknown) {
      tokenStorage.clearTokens();

      return rejectWithValue(getApiErrorMessage(error, 'Ошибка регистрации', 'register'));
    }
  }
);

export const verifyEmailUser = createAppAsyncThunk<AuthResultPayload, string>(
  'auth/verifyEmailUser',
  async (token, { dispatch, rejectWithValue }) => {
    try {
      const response = await authApi.verifyEmail(token);
      tokenStorage.setTokens(response.data);
      const user = await dispatch(fetchCurrentUser()).unwrap();

      return {
        user: normalizeUser(user),
        userId: user?.id ?? null,
      };
    } catch (error: unknown) {
      tokenStorage.clearTokens();

      return rejectWithValue(getApiErrorMessage(error, 'Не удалось подтвердить почту', 'verifyEmail'));
    }
  }
);

export const requestPasswordReset = createAppAsyncThunk<string, string>(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authApi.forgotPassword(email);

      return typeof response.data === 'string' ? response.data : 'Ссылка для сброса отправлена';
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, 'Не удалось отправить ссылку для сброса пароля', 'forgotPassword')
      );
    }
  }
);

export const resetPasswordByToken = createAppAsyncThunk<string, ResetPasswordPayload>(
  'auth/resetPasswordByToken',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authApi.resetPassword(payload);

      return typeof response.data === 'string' ? response.data : 'Пароль изменен';
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось изменить пароль', 'resetPassword'));
    }
  }
);

export const logoutUser = createAppAsyncThunk<null, void>('auth/logoutUser', async (_, { dispatch }) => {
  const refreshToken = tokenStorage.getRefreshToken();
  const accessToken = tokenStorage.getAccessToken();

  try {
    if (refreshToken && accessToken) {
      await authApi.logout(refreshToken, accessToken);
    }
  } finally {
    tokenStorage.clearTokens();
    dispatch(baseApi.util.resetApiState());
  }

  return null;
});

export const updateUserLogin = createAppAsyncThunk<User | null, string>(
  'auth/updateUserLogin',
  async (newLogin, { getState, rejectWithValue }) => {
    const state = getState();
    const { userId } = state.auth;

    if (!userId && userId !== 0) {
      return rejectWithValue('Не удалось определить ID пользователя');
    }

    try {
      return await userApi.updateLogin(userId, newLogin);
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось обновить логин', 'updateLogin'));
    }
  }
);

export const updateUserPassword = createAppAsyncThunk<string, string>(
  'auth/updateUserPassword',
  async (newPassword, { getState, rejectWithValue }) => {
    const state = getState();
    const { userId } = state.auth;

    if (!userId && userId !== 0) {
      return rejectWithValue('Не удалось определить ID пользователя');
    }

    try {
      return await userApi.updatePassword(userId, newPassword);
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось обновить пароль', 'updatePassword'));
    }
  }
);

const initialState: AuthState = {
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
    clearAuthMessages(state: AuthState) {
      state.error = null;
      state.successMessage = null;
    },
    patchAuthUser(state: AuthState, action: PayloadAction<Partial<User>>) {
      state.user = normalizeUser({
        ...state.user,
        ...action.payload,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state: AuthState, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
      })
      .addCase(initializeAuth.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.error = action.payload || 'Сессия недействительна';
      })
      .addCase(loginUser.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state: AuthState, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
        state.successMessage = 'Вы успешно вошли в аккаунт';
      })
      .addCase(loginUser.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка входа';
      })
      .addCase(registerUser.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state: AuthState) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.successMessage = 'Письмо с подтверждением отправлено';
      })
      .addCase(registerUser.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка регистрации';
      })
      .addCase(verifyEmailUser.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyEmailUser.fulfilled, (state: AuthState, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
        state.successMessage = 'Почта успешно подтверждена';
      })
      .addCase(verifyEmailUser.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось подтвердить почту';
      })
      .addCase(requestPasswordReset.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state: AuthState, action) => {
        state.isLoading = false;
        state.successMessage = action.payload;
      })
      .addCase(requestPasswordReset.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось отправить ссылку для сброса пароля';
      })
      .addCase(resetPasswordByToken.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPasswordByToken.fulfilled, (state: AuthState, action) => {
        state.isLoading = false;
        state.successMessage = action.payload;
      })
      .addCase(resetPasswordByToken.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось изменить пароль';
      })
      .addCase(fetchCurrentUser.fulfilled, (state: AuthState, action) => {
        state.user = normalizeUser(action.payload);
        state.isAuthenticated = true;
        state.userId = action.payload?.id ?? state.userId;
      })
      .addCase(fetchCurrentUser.rejected, (state: AuthState, action) => {
        state.error = action.payload || 'Не удалось получить пользователя';
      })
      .addCase(logoutUser.pending, (state: AuthState) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state: AuthState) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
        state.successMessage = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state: AuthState) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = normalizeUser();
        state.userId = null;
      })
      .addCase(updateUserLogin.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUserLogin.fulfilled, (state: AuthState, action) => {
        state.isLoading = false;
        state.user = normalizeUser(action.payload);
        state.userId = action.payload?.id ?? state.userId;
        state.successMessage = 'Логин успешно обновлен';
      })
      .addCase(updateUserLogin.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось обновить логин';
      })
      .addCase(updateUserPassword.pending, (state: AuthState) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUserPassword.fulfilled, (state: AuthState, action) => {
        state.isLoading = false;
        state.successMessage = action.payload;
      })
      .addCase(updateUserPassword.rejected, (state: AuthState, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Не удалось обновить пароль';
      });
  },
});

export const { clearAuthMessages, patchAuthUser } = authSlice.actions;
export default authSlice.reducer;

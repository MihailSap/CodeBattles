import type { User } from '@/entities/user';

export interface LoginPayload {
  email?: string;
  login?: string;
  password?: string;
  [key: string]: unknown;
}

export interface RegisterPayload {
  email?: string;
  login?: string;
  password?: string;
  [key: string]: unknown;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword?: string;
  [key: string]: unknown;
}

export interface AuthState {
  user: User;
  userId: number | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

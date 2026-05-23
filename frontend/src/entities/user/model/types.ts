export interface User {
  id: number;
  login: string;
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  avatarPath?: string;
  avatarFileTitle?: string;
  role?: string | null;
  registeredAt?: string;
  enabled?: boolean;
}

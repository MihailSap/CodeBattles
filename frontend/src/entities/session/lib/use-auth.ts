import { useAppSelector } from '@/app/providers/store';

export const useAuth = () => {
  return useAppSelector((state: LegacyValue) => state.auth);
};

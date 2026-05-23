import { useAppSelector } from '@/app/providers/store';

export const useAuth = () => useAppSelector((state) => state.auth);

import { API_BASE_URL } from '@/shared/config/api';

export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '';
  }

  if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

  if (normalizedPath.startsWith('api/v1/files/image/')) {
    return `${API_BASE_URL}/${normalizedPath}`;
  }

  return `${API_BASE_URL}/api/v1/files/image/${normalizedPath}`;
};

import axios from 'axios';

// baseURL '/api' tương đối:
// - Dev: Vite proxy /api -> http://localhost:3000
// - Docker: nginx proxy /api -> http://backend:3000
export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Gắn JWT (nếu có) vào mỗi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Backend trả response dạng envelope: { StatusCode, Message, TotalRecord, Data }.
 *  - Thành công: trả thẳng phần `Data`.
 *  - Lỗi: bóc `Message`. Nếu 401 (token hết hạn) -> xoá token & về màn đăng nhập.
 */
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'Data' in body) {
      response.data = (body as { Data: unknown }).Data;
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me');

    if (status === 401 && !isAuthCall) {
      // Phiên hết hạn giữa chừng -> reset về đăng nhập
      localStorage.removeItem('token');
      window.location.reload();
    }

    const body = error?.response?.data;
    const message =
      (body && typeof body === 'object' && 'Message' in body && (body as { Message?: string }).Message) ||
      error?.message ||
      'Có lỗi xảy ra';
    return Promise.reject(new Error(message));
  },
);

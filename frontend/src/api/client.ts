import axios from 'axios';

// baseURL '/api' tương đối:
// - Dev: Vite proxy /api -> http://localhost:3000
// - Docker: nginx proxy /api -> http://backend:3000
export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Backend trả response dạng envelope: { StatusCode, Message, TotalRecord, Data }.
 * Interceptor này:
 *  - Thành công: trả thẳng phần `Data` để code gọi API gọn gàng.
 *  - Lỗi: bóc `Message` từ envelope để hiển thị thông báo dễ hiểu.
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
    const body = error?.response?.data;
    const message =
      (body && typeof body === 'object' && 'Message' in body && (body as { Message?: string }).Message) ||
      error?.message ||
      'Có lỗi xảy ra';
    return Promise.reject(new Error(message));
  },
);

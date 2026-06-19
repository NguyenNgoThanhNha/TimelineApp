import { apiClient } from './client';
import type { AuthResult, AuthUser } from '../types/timeline';

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/login', { email, password });
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/register', { name, email, password });
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}

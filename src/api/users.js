import { api } from './client';

export async function getMe() {
  const { data } = await api.get('/users/me');
  return data;
}

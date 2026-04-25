import { api } from './client';

export async function getModels() {
  const { data } = await api.get('/models');
  return data;
}

import axios from 'axios';
import { api } from './client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Авторизация через Telegram initData.
 */
export async function authTelegram(initData, referrerId) {
  const { data } = await axios.post(
    `${BASE_URL}/api/v1/auth/telegram`,
    { init_data: initData, referrer_id: referrerId ?? null },
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

/**
 * Dev-режим: авторизация без Telegram по user_id.
 * Работает, только если на бекенде включён DEBUG.
 */
export async function authTelegramTest(userId, referrerId) {
  const params = new URLSearchParams({ user_id: String(userId) });
  if (referrerId != null) params.set('referrer_id', String(referrerId));

  const { data } = await axios.post(
    `${BASE_URL}/api/v1/auth/telegram/test?${params.toString()}`,
    null,
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

export async function logout(refreshToken) {
  await api.post('/auth/logout', { refresh_token: refreshToken });
}

// バックエンド API のラッパー
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || '通信に失敗しました');
  }
  return data;
}

// ルーム作成
export function createRoom(name) {
  return request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// ルーム参加（コードの存在確認）
export function getRoom(code) {
  return request(`/api/rooms/${code}`);
}

// 指定月のスタンプ一覧
export function getStamps(code, year, month) {
  return request(`/api/rooms/${code}/stamps?year=${year}&month=${month}`);
}

// スタンプ追加
export function addStamp(code, { date, emoji, memo }) {
  return request(`/api/rooms/${code}/stamps`, {
    method: 'POST',
    body: JSON.stringify({ date, emoji, memo }),
  });
}

// スタンプ削除
export function deleteStamp(code, id) {
  return request(`/api/rooms/${code}/stamps/${id}`, { method: 'DELETE' });
}

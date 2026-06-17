const BASE = '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getToday: () => get('/metrics/today'),
  getWeek: () => get('/metrics/week'),
  getTrend: (type) => get(`/metrics/trend/${type}`),
  postMood: (data) => post('/mood', data),
  getMoodWeek: () => get('/mood/week'),
  getInsights: () => get('/insights/weekly'),
  chat: (message) => post('/insights/chat', { message }),
  syncHealth: (data) => post('/health/sync', data),
};

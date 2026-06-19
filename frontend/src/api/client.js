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

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
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
  getWeightLogs: () => get('/weight/logs'),
  logWeight: (data) => post('/weight/log', data),
  getWeightGoals: () => get('/weight/goals'),
  saveWeightGoals: (data) => put('/weight/goals', data),
  // Habits
  getHabits: () => get('/habits'),
  createHabit: (data) => post('/habits', data),
  updateHabit: (id, data) => put(`/habits/${id}`, data),
  deleteHabit: (id) => fetch(`/api/habits/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getHabitLogs: (date) => get(`/habits/logs?date=${date}`),
  getHabitLogsRange: (from, to) => get(`/habits/logs/range?from=${from}&to=${to}`),
  logHabit: (data) => post('/habits/log', data),
  getHabitStats: () => get('/habits/stats'),
  reorderHabits: (order) => post('/habits/reorder', { order }),
  // Meditation
  getMeditationToday: (date) => get(`/meditation?date=${date || new Date().toISOString().slice(0, 10)}`),
  logMeditation: (data) => post('/meditation/log', data),
};

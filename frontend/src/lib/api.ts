import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('torneo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('torneo_token');
      localStorage.removeItem('torneo_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// --- Tournaments ---
export const tournamentsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/tournaments', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/tournaments/${id}`).then((r) => r.data),
  create: (data: object) => api.post('/tournaments', data).then((r) => r.data),
  update: (id: string, data: object) =>
    api.patch(`/tournaments/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
  getAudit: (id: string) =>
    api.get(`/tournaments/${id}/audit`).then((r) => r.data),
};

// --- Teams ---
export const teamsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/teams', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/teams/${id}`).then((r) => r.data),
  create: (data: object) => api.post('/teams', data).then((r) => r.data),
  update: (id: string, data: object) =>
    api.patch(`/teams/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  search: (q: string) =>
    api.get('/teams/search', { params: { q } }).then((r) => r.data),
  // Tournament teams
  listForTournament: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/teams`).then((r) => r.data),
  registerForTournament: (tournamentId: string, teamId: string, seed?: number) =>
    api.post(`/tournaments/${tournamentId}/teams`, { team_id: teamId, seed }).then((r) => r.data),
  removeFromTournament: (tournamentId: string, teamId: string) =>
    api.delete(`/tournaments/${tournamentId}/teams/${teamId}`),
};

// --- Matches ---
export const matchesApi = {
  listForTournament: (tournamentId: string, params?: Record<string, string>) =>
    api.get(`/tournaments/${tournamentId}/matches`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/matches/${id}`).then((r) => r.data),
  update: (id: string, data: object) =>
    api.patch(`/matches/${id}`, data).then((r) => r.data),
  submitResult: (id: string, data: object) =>
    api.post(`/matches/${id}/result`, data).then((r) => r.data),
};

// --- Bracket ---
export const bracketApi = {
  generate: (tournamentId: string, seeded = true) =>
    api.post(`/tournaments/${tournamentId}/bracket/generate`, null, { params: { seeded } }).then((r) => r.data),
  get: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/bracket`).then((r) => r.data),
};

// --- Tree ---
export const treeApi = {
  get: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/tree`).then((r) => r.data),
  traversal: (tournamentId: string, order: string) =>
    api.get(`/tournaments/${tournamentId}/tree/traversal`, { params: { order } }).then((r) => r.data),
};

// --- Graph ---
export const graphApi = {
  get: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/graph`).then((r) => r.data),
  bfs: (tournamentId: string, startMatchId: string) =>
    api.post(`/tournaments/${tournamentId}/graph/bfs`, null, { params: { start_match_id: startMatchId } }).then((r) => r.data),
  dfs: (tournamentId: string, startMatchId: string) =>
    api.post(`/tournaments/${tournamentId}/graph/dfs`, null, { params: { start_match_id: startMatchId } }).then((r) => r.data),
};

// --- Rankings ---
export const rankingsApi = {
  getStandings: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/standings`).then((r) => r.data),
  sortWithBubble: (tournamentId: string) =>
    api.post(`/tournaments/${tournamentId}/rankings/sort`).then((r) => r.data),
  getAnalysis: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/rankings/analysis`).then((r) => r.data),
};

// --- Venues ---
export const venuesApi = {
  list: () => api.get('/venues').then((r) => r.data),
  get: (id: string) => api.get(`/venues/${id}`).then((r) => r.data),
  create: (data: object) => api.post('/venues', data).then((r) => r.data),
  update: (id: string, data: object) =>
    api.patch(`/venues/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/venues/${id}`),
};

// --- Analytics ---
export const analyticsApi = {
  get: (tournamentId: string) =>
    api.get(`/tournaments/${tournamentId}/analytics`).then((r) => r.data),
  exportStandings: (tournamentId: string) =>
    `${BASE_URL}/tournaments/${tournamentId}/export/standings`,
  exportFixtures: (tournamentId: string) =>
    `${BASE_URL}/tournaments/${tournamentId}/export/fixtures`,
  exportReport: (tournamentId: string) =>
    `${BASE_URL}/tournaments/${tournamentId}/export/report`,
};

// --- Notifications ---
export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get('/notifications', { params: { unread_only: unreadOnly } }).then((r) => r.data),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),
};

export default api;

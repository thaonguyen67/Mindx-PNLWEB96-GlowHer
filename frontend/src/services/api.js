import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const isAuthRoute = config.url?.startsWith('/auth/register') || config.url?.startsWith('/auth/login');
  if (!isAuthRoute) {
    const token = localStorage.getItem('glowher_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url?.startsWith('/auth/')) {
      original._retry = true;
      try {
        const rt = localStorage.getItem('glowher_refresh_token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken: rt });
        const newToken = data.data.accessToken;
        localStorage.setItem('glowher_access_token', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    /* network error — backend not reachable */
    if (!err.response) {
      window.dispatchEvent(new CustomEvent('glowher:offline', { detail: { isOffline: true } }));
      const offline = new Error('Cannot connect to server. Please make sure the backend is running.');
      offline.isOffline = true;
      return Promise.reject(offline);
    }
    return Promise.reject(err);
  }
);

export default api;

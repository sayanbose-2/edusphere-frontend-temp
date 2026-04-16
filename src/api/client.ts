import axios from 'axios';
import { TOKEN_KEYS } from '@/lib/constants';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
  if (token && !config.url?.startsWith('/auth/login')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  res => res,
  async err => {
    const req = err.config;
    if (err.response?.status === 401 && !req._retry && !req.url?.startsWith('/auth/')) {
      req._retry = true;
      try {
        const refresh = localStorage.getItem(TOKEN_KEYS.REFRESH);
        if (!refresh) throw new Error();
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken: refresh });
        localStorage.setItem(TOKEN_KEYS.ACCESS, data.accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH, data.refreshToken);
        req.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(req);
      } catch {
        localStorage.removeItem(TOKEN_KEYS.ACCESS);
        localStorage.removeItem(TOKEN_KEYS.REFRESH);
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;

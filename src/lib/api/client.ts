import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000/v1';
  if (!envUrl.includes('/v1')) {
    return `${envUrl.replace(/\/+$/, '')}/v1`;
  }
  return envUrl;
};

export const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const storedTokens = localStorage.getItem('auth_tokens');
      if (storedTokens) {
        try {
          const { access } = JSON.parse(storedTokens);
          if (access?.token) {
            config.headers.Authorization = `Bearer ${access.token}`;
          }
        } catch {
          // Token parse error
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and Token Refresh Rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh attempt on auth endpoints
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-tokens')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => apiClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      if (typeof window === 'undefined') {
        throw new Error('Server side 401');
      }

      const storedTokens = localStorage.getItem('auth_tokens');
      if (!storedTokens) {
        throw new Error('No refresh token available');
      }

      const { refresh } = JSON.parse(storedTokens);
      if (!refresh?.token) {
        throw new Error('No refresh token');
      }

      // Call refresh-tokens endpoint with plain axios to avoid infinite loops
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-tokens`, {
        refreshToken: refresh.token,
      });

      const newTokens = response.data;
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));

      // Trigger custom storage event for sync
      window.dispatchEvent(new Event('auth_token_refreshed'));

      processQueue(null, newTokens.access.token);
      originalRequest.headers.Authorization = `Bearer ${newTokens.access.token}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new Event('auth_logout'));
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

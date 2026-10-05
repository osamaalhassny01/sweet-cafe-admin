const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '/api') {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    return 'https://sweet-cafe-backend-production.up.railway.app';
  }
  return '/api';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const parsed = JSON.parse(token);
        const jwt = parsed?.state?.token;
        const apiKey = parsed?.state?.apiKey;
        if (jwt) {
          config.headers.Authorization = `Bearer ${jwt}`;
        }
        if (apiKey) {
          config.headers['x-admin-key'] = apiKey;
        }
      } catch (error) {
        // Ignore parse error
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Unwrap the backend envelope { success, data, meta? }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      // Preserve meta at the top level for paginated responses
      if (response.data.meta) {
        response.data = {
          data: response.data.data,
          meta: response.data.meta,
        };
      } else {
        response.data = response.data.data;
      }
    }
    return response;
  },
  (error) => Promise.reject(error)
);

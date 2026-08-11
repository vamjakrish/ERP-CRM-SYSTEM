import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error structures nicely
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    const message = data?.message || 'Something went wrong';
    
    const formattedError = new Error(message) as Error & { status?: number; data?: unknown };
    formattedError.status = error.response?.status;
    formattedError.data = data?.error; // captures detailed error (e.g. stock errors)
    return Promise.reject(formattedError);
  }
);

export default api;

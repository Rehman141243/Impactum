import axios from 'axios';
import config, { getApiHeaders } from '../config/config';
import EventEmitter from 'eventemitter3';
import { getTokens, clearTokens } from './KeyChainServices';
import { refreshAccessToken } from './refreshauth';

export const eventEmitter = new EventEmitter();

const apiClient = axios.create({ baseURL: config.baseURL, timeout: 30000, headers: getApiHeaders() });
const apiAIClient = axios.create({
  baseURL: config.baseURL.replace(/\/api\/?$/, ''),
  timeout: 30000,
  headers: getApiHeaders(),
});

apiClient.interceptors.request.use(async cfg => {
  const t = await getTokens();
  if (t?.accessToken) cfg.headers.Authorization = `Bearer ${t.accessToken}`;
  return cfg;
});

let hasDispatched = false;

apiClient.interceptors.response.use(
  r => r,
  async error => {
    const req = error.config;
    if (error.response?.status !== 401 || !req || req._retry) return Promise.reject(error);
    req._retry = true;
    const result = await refreshAccessToken();
    if (result) {
      req.headers.Authorization = `Bearer ${result.access_token}`;
      return apiClient(req);
    }
    await clearTokens();
    if (!hasDispatched) {
      hasDispatched = true;
      eventEmitter.emit('tokenExpired', { message: 'Kindly Login again' });
      setTimeout(() => { hasDispatched = false; }, 5000);
    }
    return Promise.reject(error);
  },
);

export { apiAIClient, apiClient };

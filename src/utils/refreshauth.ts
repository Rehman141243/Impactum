import axios from 'axios';
import config, { getApiHeaders } from '../config/config';
import { getRefreshToken, setTokens } from './tokenStorage';

export class RefreshNetworkError extends Error {
  name = 'RefreshNetworkError';
}

let refreshPromise: Promise<{ access_token: string; refresh_token: string } | null> | null = null;

export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const { data } = await axios.post(
        `${config.baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: getApiHeaders(), timeout: 10000 },
      );
      await setTokens(data.access_token, data.refresh_token);
      return { access_token: data.access_token, refresh_token: data.refresh_token };
    } catch (e) {
      if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) return null;
      throw new RefreshNetworkError();
    } finally {
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();

  return refreshPromise;
}

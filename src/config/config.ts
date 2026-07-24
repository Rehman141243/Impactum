import { Platform } from 'react-native';
import { NEXT_PUBLIC_APP_URL_PROD, NEXT_PUBLIC_APP_URL_LOCAL } from '@env';

export let environment = 'dev' as 'dev' | 'staging' | 'production';

const getLocalUrl = (url: string) => {
  if (!url || Platform.OS !== 'android') return url;
  return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
};

const baseURL =
  environment === 'production' || environment === 'staging'
    ? NEXT_PUBLIC_APP_URL_PROD
    : getLocalUrl(NEXT_PUBLIC_APP_URL_LOCAL);

const config = {
  baseURL,
  socketURL: baseURL.replace(/\/api\/?$/, ''),
  environment,
  isProduction: environment === 'production',
  isStaging: environment === 'staging',
  isDevelopment: environment === 'dev',
};

export const getApiHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (__DEV__ && baseURL.includes('ngrok')) h['ngrok-skip-browser-warning'] = 'true';
  return h;
};

export const getSocketHeaders = (): Record<string, string> => {
  const h: Record<string, string> = {};
  if (__DEV__ && config.socketURL.includes('ngrok')) h['ngrok-skip-browser-warning'] = 'true';
  return h;
};

export default config;

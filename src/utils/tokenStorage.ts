import { getTokens, saveTokens, clearTokens } from './KeyChainServices';

export async function getRefreshToken() {
  return (await getTokens())?.refreshToken ?? null;
}

export async function setTokens(accessToken: string, refreshToken: string) {
  await saveTokens(accessToken, refreshToken);
}

export { clearTokens };

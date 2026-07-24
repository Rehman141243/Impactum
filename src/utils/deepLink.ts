export function parseAccessTokenFromUrl(url: string): string | null {
  try {
    const normalized = url.replace(/^impactum:\/\//, 'https://placeholder/');
    const parsed = new URL(normalized);

    const fromQuery =
      parsed.searchParams.get('access_token') ??
      parsed.searchParams.get('token');

    if (fromQuery) return fromQuery;

    const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    if (!hash) return null;

    const hashParams = new URLSearchParams(hash);
    return hashParams.get('access_token') ?? hashParams.get('token');
  } catch {
    const match = url.match(/(?:access_token|token)=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

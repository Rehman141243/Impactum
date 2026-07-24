import axios from 'axios';

export const getApiErrorMessage = (
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 403) {
      return 'Cannot reach the API (403). For emulators use localhost:5001. If using ngrok, run: ngrok http 5001';
    }

    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error ?? data?.message ?? err.message ?? fallback;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
};

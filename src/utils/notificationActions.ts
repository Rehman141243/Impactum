import { apiClient } from './axiosClient';

export async function handleNotificationAction(actionId: string, requestId: string) {
  try {
    if (actionId === 'accept') {
      await apiClient.post(`/boundary-requests/${requestId}/accept`);
    } else if (actionId === 'reject') {
      await apiClient.post(`/boundary-requests/${requestId}/reject`);
    }
  } catch (err: any) {
    console.error('[push] action failed:', err.response?.data || err.message);
  }
}
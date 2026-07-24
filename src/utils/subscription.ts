import { apiClient } from './axiosClient';

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret: string;
  customerId: string;
}
export async function createSubscription(paymentMethodId?: string) {
  const { data } = await apiClient.post('/subscriptions/create-subscription', {
    paymentMethodId,
  });
  return data;
}

export async function savePaymentMethod(payload: {
  stripeCustomerId: string;
  paymentMethodId: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
}) {
  const { data } = await apiClient.post('/subscriptions/save-payment-method', payload);
  return data;
}

export async function listPaymentMethods() {
  const { data } = await apiClient.get('/subscriptions/payment-methods');
  return data.paymentMethods as Array<{
    id: string;
    stripe_payment_method_id: string;
    card_brand: string;
    card_last4: string;
    card_exp_month: number;
    card_exp_year: number;
    is_default: boolean;
  }>;
}

export async function getSubscriptionStatus() {
  const { data } = await apiClient.get('/subscriptions/status');

  return data as { status: string; currentPeriodEnd: string | null };
}

export async function deletePaymentMethod(id: string) {
  const { data } = await apiClient.delete(`/subscriptions/payment-methods/${id}`);
  return data;
}

export async function setDefaultPaymentMethod(id: string) {
  const { data } = await apiClient.patch(`/subscriptions/payment-methods/${id}/default`);
  return data;
}
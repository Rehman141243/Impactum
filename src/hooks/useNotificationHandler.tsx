
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import { navigate } from './notificationsRef';
import { handleNotificationAction } from '../utils/notificationActions';
import { apiClient } from '../utils/axiosClient';

type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

interface NotificationData {
  screen?: string;
  id?: string;
  type?: string;
  boundaryId?: string;
  mediationId?: string;
  [key: string]: string | undefined;
}

const CHANNEL_ID = 'default';

async function ensureChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Default',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
  });
}

export async function displayNotification(remoteMessage: RemoteMessage) {
  try {
    await ensureChannel();

    const data = (remoteMessage.data ?? {}) as NotificationData;

    const title =
      remoteMessage.notification?.title ?? data.title ?? 'Notification';
    const body =
      remoteMessage.notification?.body ?? data.body ?? '';

    const actions =
      data.type === 'boundary_created' || data.type === 'mediation_requested'
        ? [
            { title: 'Accept', pressAction: { id: 'accept' } },
            { title: 'Reject', pressAction: { id: 'reject' } },
          ]
        : undefined;

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_notification',
        largeIcon: require('../../assets/logo1.png'),
        color: '#2D6CDF',
        sound: 'default',
        pressAction: { id: 'default' },
        ...(actions ? { actions } : {}),
      },
    });
  } catch (err) {
    console.error('[notif] displayNotification FAILED:', err);
  }
}

function handleTap(data?: NotificationData | Record<string, string>) {
  if (!data?.screen) return;
  navigate(data.screen, { id: data.id });
}

async function respondToMediation(mediationId: string, accept: boolean) {
  try {
    await apiClient.patch(`/mediation/${mediationId}/respond`, { accept });
    console.log('[notif] mediation response sent:', { mediationId, accept });
  } catch (err: any) {
    console.error('[notif] failed to respond to mediation:', err.response?.status, err.response?.data);
  }
}


export async function handleAction(
  actionId: string | undefined,
  notificationId: string | undefined,
  data?: NotificationData,
) {
  if (!actionId) return;

  if (data?.type === 'boundary_created' && data.boundaryId) {
    await handleNotificationAction(actionId, data.boundaryId);
  } else if (data?.type === 'mediation_requested' && data.mediationId) {
    await respondToMediation(data.mediationId, actionId === 'accept');
  } else {
    return;
  }

  if (notificationId) {
    await notifee.cancelNotification(notificationId);
  }
}

export function setupNotificationListeners() {
  const unsubFCG = messaging().onMessage(async (remoteMessage) => {
    console.log('[notif] onMessage fired:', JSON.stringify(remoteMessage));
    await displayNotification(remoteMessage);
  });

  const unsubNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    console.log('[notif] foreground event:', type, JSON.stringify(detail));
    if (type === EventType.PRESS) {
      handleTap(detail.notification?.data as NotificationData);
    } else if (type === EventType.ACTION_PRESS) {
      handleAction(
        detail.pressAction?.id,
        detail.notification?.id,
        detail.notification?.data as NotificationData,
      );
    }
  });

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('[notif] onNotificationOpenedApp fired');
    handleTap(remoteMessage.data as NotificationData);
  });

  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log('[notif] getInitialNotification fired');
      handleTap(remoteMessage.data as NotificationData);
    }
  });

  return () => {
    unsubFCG();
    unsubNotifee();
  };
}
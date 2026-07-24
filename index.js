
import './global.css';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { displayNotification, handleAction } from './src/hooks/useNotificationHandler';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await displayNotification(remoteMessage);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    console.log('[notifee] background action press:', detail.pressAction?.id, detail.notification?.data);
    await handleAction(
      detail.pressAction?.id,
      detail.notification?.id,
      detail.notification?.data,
    );
  } else if (type === EventType.PRESS) {
    console.log('[notifee] background press:', detail.notification?.data);
  }
});

AppRegistry.registerComponent(appName, () => App);
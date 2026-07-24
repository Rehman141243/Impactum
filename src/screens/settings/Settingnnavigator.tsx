import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsTabScreen from './SettingsTabScreen';
import AccountScreen from './SettingScreen';
import SubscriptionPaymentScreen from './SubsccriptinScreen';
import ChangePasswordScreen from './ChangePasswordScreen';

export type SettingStackParamList = {
  SettingTab: { justSubscribed?: boolean } | undefined;
  SettingScreen: undefined;
  SubscriptionPayment: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<SettingStackParamList>();

export default function SettingStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingTab" component={SettingsTabScreen} />
      <Stack.Screen name="SettingScreen" component={AccountScreen} />
      <Stack.Screen name="SubscriptionPayment" component={SubscriptionPaymentScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

    </Stack.Navigator>
  );
}
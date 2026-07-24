import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../components/navigation/CustomTabBar';
import HomeStackNavigator from '../screens/home/homennavigator';
import GuideTabScreen from '../screens/guide/GuideTabScreen';
import SettingsTabScreen from '../screens/settings/SettingsTabScreen';
import SettingStackNavigator from '../screens/settings/Settingnnavigator';
import { View } from 'react-native';
import GuideStack from '../screens/guide/Guidenavigator';
import type { SettingStackParamList } from '../screens/settings/Settingnnavigator';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  GuideTab: undefined;
  SettingsTab: NavigatorScreenParams<SettingStackParamList>;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: '#0A0E17' },
        }}
      >
        <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
        <Tab.Screen name="GuideTab" component={GuideStack} />
        <Tab.Screen name="SettingsTab" component={SettingStackNavigator} />
      </Tab.Navigator>
    </View>
  );
}
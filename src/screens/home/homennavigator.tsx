import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeTabScreen from './HomeTabScreen';
import RelationshipDetailScreen from './Relationshipdetailscreen';
import PersonProfileScreen from './PersonProfilescreen';
import ProfileFieldEditScreen from './ProfileFeildEditScreen';
import AccountScreen from '../settings/SettingScreen';
import { PersonProfile } from '../../types/relationship';
import ChatScreen from './chatscreen';

export type HomeStackParamList = {
  HomeTabScreen: undefined;
  RelationshipDetail: { relationshipId: string };
  PersonProfile: { relationshipId: string; who: 'me' | 'partner' };
  ProfileFieldEdit: { relationshipId: string; who: 'me' | 'partner'; field: keyof PersonProfile };
  AccountScreen: undefined;
  Chat: { relationshipId: string; partnerName: string }; 
  
  
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabScreen" component={HomeTabScreen} />
      <Stack.Screen name="RelationshipDetail" component={RelationshipDetailScreen} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} />
      <Stack.Screen
        name="ProfileFieldEdit"
        component={ProfileFieldEditScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="AccountScreen" component={AccountScreen} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
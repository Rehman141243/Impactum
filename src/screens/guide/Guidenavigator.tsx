import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import GuideTabScreen from './GuideTabScreen';
import HowImpactumWasBornScreen from './screens/originscreen';
import RelationshipsGuideScreen from './screens/relationshipGuide';
import DrHarmonyGuideScreen from './screens/harmoneyguidescreen';
import FAQItem from './screens/faq';
import FAQScreen from './screens/faq';

export type GuideStackParamList = {
  GuideHome: undefined;
  OriginScreen: undefined;
  RelationGuideScreen:undefined;
  harmoneyGuideScreen:undefined;
  FAQScreen:undefined
};

const Stack = createNativeStackNavigator<GuideStackParamList>();

export default function GuideStack() {
  return (
    <Stack.Navigator
      initialRouteName="GuideHome"
      screenOptions={{
        headerShown: false,
      
      }}>
      <Stack.Screen
        name="GuideHome"
        component={GuideTabScreen}
      />

      <Stack.Screen
        name="OriginScreen"
        component={HowImpactumWasBornScreen}
      />
        <Stack.Screen
        name="RelationGuideScreen"
        component={RelationshipsGuideScreen}
      />
         <Stack.Screen
        name="harmoneyGuideScreen"
        component={DrHarmonyGuideScreen}
      />
        <Stack.Screen
        name="FAQScreen"
        component={FAQScreen}
      />
    </Stack.Navigator>
  );
}
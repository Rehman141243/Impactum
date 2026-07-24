
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';


import BrandIcon from '../../components/common/brandicon';
import { GuideStackParamList } from './Guidenavigator';
import AppText from '../../components/common/AppText';

export interface GuideItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  labelColor: string;
  borderColor: string;
  iconBg: string;
  icon: React.ReactNode;
  screen?: string;
}

interface Props {
  item: GuideItem;
  onPress?: () => void;
}

 function GuideCard({
  item,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="mb-4">
      <View
        className="rounded-card p-5 bg-brand-bgCardMain border"
        style={{
          borderColor: item.borderColor,
        }}>
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{
              backgroundColor: item.iconBg,
            }}>
            {item.icon}
          </View>

          <View className="flex-1 ml-4">
            <AppText
              style={{
                color: item.labelColor,
              }}
              className="text-[11px] uppercase mb-1">
              {item.label}
            </AppText>

            <AppText className="text-brand-textPrimary text-body-lg font-sansSemiBold">
              {item.title}
            </AppText>

            <AppText className="text-brand-textSecondary text-body-sm mt-1">
              {item.subtitle}
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}






type NavigationProp =
  NativeStackNavigationProp<
    GuideStackParamList,
    'GuideHome'
  >;

function SparkleIcon() {
  return (
    <Text className="text-brand-tabActive text-lg">
      ✦
    </Text>
  );
}

function DiamondIcon() {
  return (
    <Text className="text-brand-purpleSoft text-lg">
      ◆
    </Text>
  );
}

function HarmonyIcon() {
  return (
    <Text className="text-brand-tabActive text-lg">
      H
    </Text>
  );
}

function FaqIcon() {
  return (
    <Text className="text-brand-gold text-lg">
      ?
    </Text>
  );
}


const GUIDE_ITEMS: GuideItem[] = [
  {
    id: '1',
    label: 'The Story',
    title: 'The Origin',
    subtitle: 'Why IMPACTUM exists and who created it.',
    labelColor: '#7EB8FF',
    borderColor: '#1E3A5F',
    iconBg: '#152238',
    icon: <SparkleIcon />,
    screen: 'OriginScreen',
  },

  {
    id: '2',
    label: 'The Sections',
    title: 'Your Relationships',
    subtitle: 'What is the purpose of relationships within IMPACTUM.',
    labelColor: '#A78BFA',
    borderColor: '#2D2450',
    iconBg: '#1C1830',
    icon: <DiamondIcon />,
    screen:'RelationGuideScreen'
  },

  {
    id: '3',
    label: 'The Mediator',
    title: 'Dr. Harmony',
    subtitle: 'Who he is and how he adds value to your relationships.',
    labelColor: '#7EB8FF',
    borderColor: '#1E3A5F',
    iconBg: '#152238',
    icon: <HarmonyIcon />,
    screen:'harmoneyGuideScreen'
  },

  {
    id: '4',
    label: 'Frequently Asked',
    title: 'Frequently Asked',
    subtitle: 'Everything you need to know about how it works.',
    labelColor: '#C9A84C',
    borderColor: '#3D3420',
    iconBg: '#2A2418',
    icon: <FaqIcon />,
    screen:'FAQScreen'
  },
];

export default function GuideTabScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView
      className="flex-1 bg-brand-bgMain"
      edges={['top']}>
            <StatusBar
        translucent={false}
        backgroundColor="#0C1422"
        barStyle="light-content"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 4,
        }}>
        <View className="items-center mt-4 mb-8">
          <BrandIcon size={72} />

          <AppText className="font-heading text-display-lg text-brand-textPrimary mt-4">
            IMPACTUM
          </AppText>

          <AppText className="font-headingItalic text-body-md text-brand-textSecondary italic">
            Nurture your connections.
          </AppText>
        </View>

        {GUIDE_ITEMS.map(item => (
          <GuideCard
            key={item.id}
            item={item}
            onPress={() => {
              if (item.screen === 'OriginScreen') {
                navigation.navigate('OriginScreen');
              }
              if (item.screen === 'RelationGuideScreen') {
                navigation.navigate('RelationGuideScreen');
              }
              if (item.screen === 'harmoneyGuideScreen') {
                navigation.navigate('harmoneyGuideScreen');
              }
              if (item.screen === 'FAQScreen') {
                navigation.navigate('FAQScreen');
              }
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
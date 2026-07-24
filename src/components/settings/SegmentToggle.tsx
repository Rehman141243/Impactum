import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentToggle({ options, value, onChange }: Props) {
  return (
    <View className="flex-row bg-brand-bgMain rounded-full p-0.5 border border-brand-borderSoft">
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`px-3 py-1 rounded-full min-w-[36px] items-center ${
              active ? 'bg-brand-tabActive' : ''
            }`}>
            <Text
              className={`font-sansSemiBold text-body-sm ${
                active ? 'text-white' : 'text-brand-textMuted'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

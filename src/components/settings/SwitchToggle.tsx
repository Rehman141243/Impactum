import React from 'react';
import { Pressable, View } from 'react-native';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function SwitchToggle({ value, onChange }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      className={`w-12 h-7 rounded-full justify-center px-0.5 ${
        value ? 'bg-brand-tabActive' : 'bg-brand-bgCardSoft border border-brand-borderSoft'
      }`}>
      <View
        className={`w-5 h-5 rounded-full bg-white ${
          value ? 'self-end' : 'self-start'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

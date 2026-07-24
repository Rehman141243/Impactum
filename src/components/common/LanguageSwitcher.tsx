import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Check, Languages } from 'lucide-react-native';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher() {
  const { width } = useWindowDimensions();
  const { currentLang, isReady, isTranslating, languages, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const current = languages.find(l => l.code === currentLang);

  const handleSelect = async (code: string) => {
    await setLanguage(code);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => isReady && !isTranslating && setOpen(true)}
        disabled={!isReady || isTranslating}
        className="flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-brand-bgCardSoft border border-brand-borderSoft">
        {isTranslating ? (
          <ActivityIndicator size="small" color="#4F7BF7" />
        ) : (
          <Languages size={16} color="#4F7BF7" />
        )}
        <Text className="font-sansSemiBold text-body-sm text-brand-tabActive uppercase">
          {current?.code ?? 'en'}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/50 justify-center px-6" onPress={() => setOpen(false)}>
          <Pressable
            onPress={e => e.stopPropagation()}
            className="bg-brand-bgCardMain border border-brand-borderSoft rounded-card p-4 self-center"
            style={{ width: Math.min(width * 0.85, 340) }}>
            <Text className="font-sansSemiBold text-body-lg text-brand-textPrimary mb-3">
              Select Language
            </Text>

            {languages.map(lang => {
              const active = lang.code === currentLang;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSelect(lang.code)}
                  disabled={isTranslating}
                  className={`flex-row items-center justify-between px-4 py-3 rounded-xl mb-1 ${
                    active ? 'bg-brand-tabActive/15' : ''
                  }`}>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-sansMedium text-body-sm text-brand-textMuted uppercase">
                      {lang.code}
                    </Text>
                    <Text className="text-body-md">{lang.flag}</Text>
                    <Text className="font-sans text-body-sm text-brand-textSecondary">
                      {lang.fullName}
                    </Text>
                  </View>
                  {active ? <Check size={18} color="#4F7BF7" /> : null}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setOpen(false)}
              className="mt-3 py-3 rounded-xl bg-brand-tabActive items-center">
              <Text className="font-sansSemiBold text-body-md text-white">Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

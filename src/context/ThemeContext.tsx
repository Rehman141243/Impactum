import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, StatusBar, View } from 'react-native';
import { useColorScheme, vars } from 'nativewind';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'APP_THEME';

const darkColors = {
  bg: '#0C1422',
  bgCard: '#131D2E',
  bgInput: '#F0F2F5',
  bgElevated: '#1A2740',
  primary: '#6B21A8',
  primaryLight: '#7C3AED',
  accent: '#A855F7',
  border: '#1E2D42',
  borderLight: '#2A3F5C',
  divider: '#1E2D42',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textSub: '#94A3B8',
  textMuted: '#64748B',
  textLabel: '#CBD5E1',
  textInput: '#0F172A',
  textPlaceholder: '#94A3B8',
  btnBg: '#0F172A',
  btnBorder: '#334155',
  google: '#1E293B',
  iconStroke: '#64748B',
  iconActive: '#A855F7',
  white: '#FFFFFF',
  gold: '#C9A84C',
  goldLight: '#E8D5A3',
  tabActive: '#4F7BF7',
  tabInactive: '#64748B',
  bgMain: '#0A0E17',
  bgCardMain: '#121A2B',
  bgCardSoft: '#161F33',
  borderSoft: '#1E2A40',
  blueSoft: '#7EB8FF',
  purpleSoft: '#A78BFA',
  statusBarStyle: 'light-content' as const,
};

const lightColors: typeof darkColors = {
  bg: '#F7F8FA',
  bgCard: '#FFFFFF',
  bgInput: '#F0F2F5',
  bgElevated: '#FFFFFF',
  primary: '#6B21A8',
  primaryLight: '#7C3AED',
  accent: '#A855F7',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  divider: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textSub: '#64748B',
  textMuted: '#94A3B8',
  textLabel: '#334155',
  textInput: '#0F172A',
  textPlaceholder: '#94A3B8',
  btnBg: '#F1F5F9',
  btnBorder: '#CBD5E1',
  google: '#FFFFFF',
  iconStroke: '#64748B',
  iconActive: '#A855F7',
  white: '#FFFFFF',
  gold: '#C9A84C',
  goldLight: '#B8973A',
  tabActive: '#4F7BF7',
  tabInactive: '#94A3B8',
  bgMain: '#FFFFFF',
  bgCardMain: '#F8FAFC',
  bgCardSoft: '#F1F5F9',
  borderSoft: '#E2E8F0',
  blueSoft: '#3B82F6',
  purpleSoft: '#8B5CF6',
  statusBarStyle: 'dark-content' as const,
};

const darkVars = vars({
  '--color-bg': darkColors.bg,
  '--color-bg-card': darkColors.bgCard,
  '--color-bg-input': darkColors.bgInput,
  '--color-bg-elevated': darkColors.bgElevated,
  '--color-primary': darkColors.primary,
  '--color-primary-light': darkColors.primaryLight,
  '--color-accent': darkColors.accent,
  '--color-border': darkColors.border,
  '--color-border-light': darkColors.borderLight,
  '--color-divider': darkColors.divider,
  '--color-text-primary': darkColors.textPrimary,
  '--color-text-secondary': darkColors.textSecondary,
  '--color-text-sub': darkColors.textSub,
  '--color-text-muted': darkColors.textMuted,
  '--color-text-label': darkColors.textLabel,
  '--color-text-input': darkColors.textInput,
  '--color-text-placeholder': darkColors.textPlaceholder,
  '--color-btn-bg': darkColors.btnBg,
  '--color-btn-border': darkColors.btnBorder,
  '--color-google': darkColors.google,
  '--color-icon-stroke': darkColors.iconStroke,
  '--color-icon-active': darkColors.iconActive,
  '--color-gold': darkColors.gold,
  '--color-gold-light': darkColors.goldLight,
  '--color-tab-active': darkColors.tabActive,
  '--color-tab-inactive': darkColors.tabInactive,
  '--color-bg-main': darkColors.bgMain,
  '--color-bg-card-main': darkColors.bgCardMain,
  '--color-bg-card-soft': darkColors.bgCardSoft,
  '--color-border-soft': darkColors.borderSoft,
  '--color-blue-soft': darkColors.blueSoft,
  '--color-purple-soft': darkColors.purpleSoft,
});

const lightVars = vars({
  '--color-bg': lightColors.bg,
  '--color-bg-card': lightColors.bgCard,
  '--color-bg-input': lightColors.bgInput,
  '--color-bg-elevated': lightColors.bgElevated,
  '--color-primary': lightColors.primary,
  '--color-primary-light': lightColors.primaryLight,
  '--color-accent': lightColors.accent,
  '--color-border': lightColors.border,
  '--color-border-light': lightColors.borderLight,
  '--color-divider': lightColors.divider,
  '--color-text-primary': lightColors.textPrimary,
  '--color-text-secondary': lightColors.textSecondary,
  '--color-text-sub': lightColors.textSub,
  '--color-text-muted': lightColors.textMuted,
  '--color-text-label': lightColors.textLabel,
  '--color-text-input': lightColors.textInput,
  '--color-text-placeholder': lightColors.textPlaceholder,
  '--color-btn-bg': lightColors.btnBg,
  '--color-btn-border': lightColors.btnBorder,
  '--color-google': lightColors.google,
  '--color-icon-stroke': lightColors.iconStroke,
  '--color-icon-active': lightColors.iconActive,
  '--color-gold': lightColors.gold,
  '--color-gold-light': lightColors.goldLight,
  '--color-tab-active': lightColors.tabActive,
  '--color-tab-inactive': lightColors.tabInactive,
  '--color-bg-main': lightColors.bgMain,
  '--color-bg-card-main': lightColors.bgCardMain,
  '--color-bg-card-soft': lightColors.bgCardSoft,
  '--color-border-soft': lightColors.borderSoft,
  '--color-blue-soft': lightColors.blueSoft,
  '--color-purple-soft': lightColors.purpleSoft,
});

type ThemeContextValue = {
  theme: ThemeMode;
  colors: typeof darkColors;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark',
  );
  const { setColorScheme } = useColorScheme(); 

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
        setColorScheme(saved); 
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setColorScheme(next); 
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: theme === 'dark' ? darkColors : lightColors,
        isDark: theme === 'dark',
        toggleTheme,
      }}
    >
      <View style={theme === 'dark' ? darkVars : lightVars} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


export function ThemedStatusBar() {
  const { colors } = useTheme();
  return (
    <StatusBar
      barStyle={colors.statusBarStyle}
      backgroundColor={colors.bg}
      translucent={false}
    />
  );
}
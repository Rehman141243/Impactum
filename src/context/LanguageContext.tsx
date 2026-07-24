import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_LANGUAGES, DEFAULT_LANGUAGE } from '../constants/languages';
import { googleTranslate } from '../utils/googleTranslate';

const STORAGE_KEY = 'app_language';

interface LanguageContextValue {
  currentLang: string;
  isReady: boolean;
  isTranslating: boolean;
  languages: typeof APP_LANGUAGES;
  setLanguage: (code: string) => Promise<void>;
  t: (text: string) => string;
  translateAsync: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function cacheKey(lang: string, text: string) {
  return `${lang}::${text}`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [cache, setCache] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved && APP_LANGUAGES.some(l => l.code === saved)) {
          setCurrentLang(saved);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const translateAsync = useCallback(
    async (text: string): Promise<string> => {
      if (!text.trim() || currentLang === DEFAULT_LANGUAGE) {
        return text;
      }

      const key = cacheKey(currentLang, text);
      if (cache[key]) {
        return cache[key];
      }

      try {
        const translated = await googleTranslate(text, currentLang, DEFAULT_LANGUAGE);
        setCache(prev => ({ ...prev, [key]: translated }));
        return translated;
      } catch {
        return text;
      }
    },
    [cache, currentLang],
  );

  const t = useCallback(
    (text: string): string => {
      if (!text.trim() || currentLang === DEFAULT_LANGUAGE) {
        return text;
      }
      return cache[cacheKey(currentLang, text)] ?? text;
    },
    [cache, currentLang, tick],
  );

  const setLanguage = useCallback(async (code: string) => {
    if (!APP_LANGUAGES.some(l => l.code === code) || code === currentLang) {
      return;
    }

    setIsTranslating(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);
      setCurrentLang(code);
      setTick(n => n + 1);
    } finally {
      setIsTranslating(false);
    }
  }, [currentLang]);

  const value = useMemo(
    () => ({
      currentLang,
      isReady,
      isTranslating,
      languages: APP_LANGUAGES,
      setLanguage,
      t,
      translateAsync,
    }),
    [currentLang, isReady, isTranslating, setLanguage, t, translateAsync],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

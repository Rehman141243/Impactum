export interface AppLanguage {
  code: string;
  flag: string;
  fullName: string;
}

export const APP_LANGUAGES: AppLanguage[] = [
  { code: 'en', flag: '🇺🇸', fullName: 'English' },
  // { code: 'th', flag: '🇹🇭', fullName: 'ไทย' },
  // { code: 'de', flag: '🇩🇪', fullName: 'Deutsch' },
  // { code: 'fr', flag: '🇫🇷', fullName: 'Français' },
  { code: 'es', flag: '🇪🇸', fullName: 'Español' },
];

export const DEFAULT_LANGUAGE = 'en';

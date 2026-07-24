import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

/** For placeholders and non-Text strings. */
export function useTranslated(text: string): string {
  const { currentLang, translateAsync, t } = useLanguage();
  const [display, setDisplay] = useState(() => t(text));

  useEffect(() => {
    if (currentLang === 'en') {
      setDisplay(text);
      return;
    }

    const cached = t(text);
    setDisplay(cached);

    if (cached === text) {
      translateAsync(text).then(setDisplay);
    }
  }, [text, currentLang, translateAsync, t]);

  return display;
}

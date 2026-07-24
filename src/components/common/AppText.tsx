
import React, { useEffect, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

interface Props extends TextProps {
  children?: string | React.ReactNode;
}


export default function AppText({ children, ...props }: Props) {
  const { currentLang, translateAsync, t } = useLanguage();


  const isString = typeof children === 'string';

  const [display, setDisplay] = useState<React.ReactNode>(() =>
    isString ? t(children as string) : children,
  );

  useEffect(() => {
    if (!isString) {
  
      setDisplay(children);
      return;
    }

    const str = children as string;

    if (currentLang === 'en') {
      setDisplay(str);
      return;
    }

    const cached = t(str);
    setDisplay(cached);

    if (cached === str) {
      translateAsync(str).then(setDisplay);
    }
  }, [children, currentLang, translateAsync, t, isString]);

  return <Text {...props}>{display}</Text>;
}
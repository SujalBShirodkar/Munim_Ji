'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from './i18n';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: typeof translations['hi'];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'hi',
  toggleLanguage: () => {},
  setLanguage: () => {},
  t: translations['hi'],
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('hi');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  const t = translations[lang] || translations['hi'];

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, setLanguage: setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


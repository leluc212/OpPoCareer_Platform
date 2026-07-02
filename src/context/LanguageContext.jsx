import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../locales/translations';
import { translationService } from '../services/translationService';

const LANG_CONTEXT_KEY = '__OpPoLanguageContext__';
if (!window[LANG_CONTEXT_KEY]) {
  window[LANG_CONTEXT_KEY] = createContext();
}
const LanguageContext = window[LANG_CONTEXT_KEY];

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'vi'; // Default to Vietnamese
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const translateText = useCallback(async (text, forceSourceLang = 'vi') => {
    if (language === forceSourceLang) {
      return { translatedText: text, type: 'original' };
    }
    return await translationService.translate(text, language, forceSourceLang);
  }, [language]);

  const t = translations[language] || translations.vi;

  const value = {
    language,
    changeLanguage,
    isVietnamese: language === 'vi',
    isEnglish: language === 'en',
    t,
    translateText, // Function for dynamic content
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

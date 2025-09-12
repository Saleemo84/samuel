import React, { createContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import type { Language } from '../types';

// Define types for translations to ensure type safety
type Translations = {
  [key: string]: string;
};

type AllTranslations = {
  ar: Translations;
  en: Translations;
  ku: Translations;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  // FIX: Update t function to accept an options object for interpolation.
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
    language: 'ar',
    setLanguage: () => {},
    // FIX: Update default t function to match new signature.
    t: (key: string, _options?: { [key: string]: string | number }) => key,
});

export const LanguageProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [translations, setTranslations] = useState<AllTranslations | null>(null);

  useEffect(() => {
    const fetchTranslations = async () => {
        try {
            // Using fetch with absolute paths is more cross-browser compatible
            // than JSON module imports with assertions.
            const [arRes, enRes, kuRes] = await Promise.all([
                fetch('/locales/ar.json'),
                fetch('/locales/en.json'),
                fetch('/locales/ku.json')
            ]);

            if (!arRes.ok || !enRes.ok || !kuRes.ok) {
                throw new Error('Failed to fetch translation files');
            }

            const ar = await arRes.json();
            const en = await enRes.json();
            const ku = await kuRes.json();
            setTranslations({ ar, en, ku });
        } catch (error) {
            console.error("Failed to load translations:", error);
            // Provide an empty object as a fallback to prevent the app from crashing.
            setTranslations({ ar: {}, en: {}, ku: {} });
        }
    };
    fetchTranslations();

    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['ar', 'en', 'ku'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // FIX: Implement interpolation logic in the t function.
  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    if (!translations) {
        // Return key as a fallback if translations are not yet loaded.
        return key;
    }
    const langTranslations = translations[language];
    let translation = langTranslations[key] || key;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }

    return translation;
  }, [language, translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

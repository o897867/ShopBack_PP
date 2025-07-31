import { useState, useEffect, createContext, useContext } from 'react';
import { detectUserLanguage } from '../utils/languageDetection';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const lang = detectUserLanguage();
    setCurrentLanguage(lang);
  }, []);

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
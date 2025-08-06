import { useState, useEffect, createContext, useContext } from 'react';
import { detectUserLanguage } from '../utils/languageDetection';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true); // 添加这行

  useEffect(() => {
    const initLanguage = async () => {
      setIsLoading(true); // 添加这行
      const lang = detectUserLanguage();
      setCurrentLanguage(lang);
      setIsLoading(false); // 添加这行
    };

    initLanguage();
  }, []);

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      changeLanguage, 
      isLoading // 添加这个
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
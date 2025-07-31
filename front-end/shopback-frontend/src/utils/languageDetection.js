export const detectUserLanguage = () => {
  // 检查本地存储
  const savedLanguage = localStorage.getItem('preferred-language');
  if (savedLanguage) return savedLanguage;

  // 检查浏览器语言
  const browserLanguage = navigator.language || navigator.userLanguage;
  const supportedLanguages = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'];
  
  // 匹配最佳语言
  if (supportedLanguages.includes(browserLanguage)) {
    return browserLanguage;
  }
  
  const primaryLang = browserLanguage.split('-')[0];
  const match = supportedLanguages.find(lang => lang.startsWith(primaryLang));
  return match || 'en';
};
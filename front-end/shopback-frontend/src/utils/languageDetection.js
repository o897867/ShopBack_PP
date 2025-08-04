export const detectUserLanguage = () => {
  // 检查本地存储
  const savedLanguage = localStorage.getItem('preferred-language');
  if (savedLanguage) return savedLanguage;

  // 检查浏览器语言
  const browserLanguage = navigator.language || navigator.userLanguage;
  const supportedLanguages = ['en', 'zh-CN']; // 确保这里只有你支持的语言
  
  // 精确匹配
  if (supportedLanguages.includes(browserLanguage)) {
    return browserLanguage;
  }
  
  // 部分匹配
  const primaryLang = browserLanguage.split('-')[0];
  if (primaryLang === 'zh') {
    return 'zh-CN';
  }
  
  return 'en'; // 默认英语
};
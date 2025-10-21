import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronRight } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);

  const languages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const otherLanguages = languages.filter(lang => lang.code !== i18n.language);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsExpanded(false);
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* 扩展的语言选项 - 向左展开 */}
      <div className={`flex items-center transition-all duration-300 ease-in-out ${
        isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
      }`}>
        {otherLanguages.map((language, index) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center space-x-1 px-2 py-1.5 mx-0.5 rounded-md text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
              isExpanded ? 'scale-100' : 'scale-95'
            }`}
            style={{
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
            }}
          >
            <span className="text-base">{language.flag}</span>
            <span className="hidden sm:inline">{language.name}</span>
          </button>
        ))}
      </div>

      {/* 当前语言按钮 */}
      <button 
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">{currentLanguage.name}</span>
        <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${
          isExpanded ? 'rotate-180' : 'rotate-0'
        }`} />
      </button>
    </div>
  );
};

export default LanguageSwitcher;
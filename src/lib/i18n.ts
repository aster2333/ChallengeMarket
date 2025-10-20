import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译资源文件
import zhCommon from '../locales/zh/common.json';
import zhHome from '../locales/zh/home.json';
import zhChallenge from '../locales/zh/challenge.json';
import zhProfile from '../locales/zh/profile.json';
import zhSettlement from '../locales/zh/settlement.json';
import zhErrors from '../locales/zh/errors.json';

import enCommon from '../locales/en/common.json';
import enHome from '../locales/en/home.json';
import enChallenge from '../locales/en/challenge.json';
import enProfile from '../locales/en/profile.json';
import enSettlement from '../locales/en/settlement.json';
import enErrors from '../locales/en/errors.json';

const resources = {
  zh: {
    common: zhCommon,
    home: zhHome,
    challenge: zhChallenge,
    profile: zhProfile,
    settlement: zhSettlement,
    errors: zhErrors
  },
  en: {
    common: enCommon,
    home: enHome,
    challenge: enChallenge,
    profile: enProfile,
    settlement: enSettlement,
    errors: enErrors
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // 语言检测配置
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // 命名空间配置
    ns: ['common', 'home', 'challenge', 'profile', 'settlement', 'errors'],
    defaultNS: 'common',
    
    // 插值配置
    interpolation: {
      escapeValue: false, // React 已经安全处理了
    },
  });

export default i18n;
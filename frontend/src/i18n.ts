import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import cs from '../public/locales/cs/common.json';
import en from '../public/locales/en/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      cs: { common: cs },
    },
    ns: ['common'],
    defaultNS: 'common',
    fallbackLng: 'en',
    load: 'languageOnly',
    debug: import.meta.env.DEV,

    react: {
      useSuspense: false,
    },

    detection: {
      order: [
        'navigator',
        'querystring',
        'cookie',
        'localStorage',
        'sessionStorage',
        'htmlTag',
      ],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
      cookieMinutes: 10080,
    },
  });

export default i18n;

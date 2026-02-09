import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ns: ['common'],
    defaultNS: 'common',
    // resources,
    fallbackLng: 'en',
    debug: import.meta.env.NODE_ENV === 'development',

    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Detection options
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
      cookieMinutes: 10080, // 7 days
    },
  });

export default i18n;

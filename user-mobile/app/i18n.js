import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';

const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem('joymart_language');
  
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: enTranslations,
        hi: hiTranslations
      },
      lng: savedLanguage || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });
};

initI18n();

export default i18n;

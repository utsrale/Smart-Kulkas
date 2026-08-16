/* eslint-disable import/no-named-as-default-member -- i18n.use()/i18n.changeLanguage() is the standard i18next pattern */
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import id from './locales/id.json';

export type AppLanguage = 'id' | 'en';

const LANGUAGE_STORAGE_KEY = '@smartkulkas/language';

export const SUPPORTED_LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'English' },
];

// Default bahasa aplikasi adalah Inggris; pengguna bisa memilih Bahasa Indonesia
// lewat switcher di Settings (preferensi tersimpan dan menimpa default ini).
const DEFAULT_LANGUAGE: AppLanguage = 'en';

let initPromise: Promise<void> | null = null;

/** Initialize i18next (idempotent) and restore the saved language preference. */
export const initI18n = (): Promise<void> => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        id: { translation: id },
      },
      lng: DEFAULT_LANGUAGE,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnNull: false,
    });

    // Restore the user's saved preference (if any) — overrides device language.
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'id' || saved === 'en') {
        await i18n.changeLanguage(saved);
      }
    } catch {
      // Non-fatal — the device language stays active.
    }
  })();

  return initPromise;
};

/** Change the app language and persist the preference. */
export const changeLanguage = async (lang: AppLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Non-fatal — the preference just won't persist.
  }
};

/** The display name of the current language, used for AI prompts. */
export const getAiLanguageName = (): string => {
  const code = String(i18n.language || '').toLowerCase();
  return code.startsWith('id') ? 'Bahasa Indonesia' : 'English';
};

export default i18n;

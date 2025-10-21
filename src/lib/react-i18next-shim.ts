import { useEffect, useMemo, useSyncExternalStore } from 'react';
import i18n from './i18next-shim';

export type UseTranslationResponse = {
  t: (key: string, options?: Record<string, unknown>) => string;
  i18n: typeof i18n;
};

export const initReactI18next = {
  type: '3rdParty',
  init: () => {
    // no-op: shim does not require explicit initialisation
  },
};

export function useTranslation(namespace?: string): UseTranslationResponse {
  const subscribe = (callback: () => void) => {
    i18n.on('languageChanged', callback);
    return () => i18n.off('languageChanged', callback);
  };

  useSyncExternalStore(subscribe, () => i18n.language);

  const translator = useMemo(() => {
    return (key: string, options?: Record<string, unknown>) => {
      const namespacedKey = namespace ? `${namespace}:${key}` : key;
      return i18n.t(namespacedKey, options);
    };
  }, [namespace, i18n.language]);

  useEffect(() => {
    // Trigger effect when namespace changes to keep dependencies aligned
  }, [namespace]);

  return { t: translator, i18n };
}

export function Trans({ children }: { children: string }) {
  return children;
}

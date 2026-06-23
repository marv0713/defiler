import { createContext, useContext, useMemo } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { translate } from "./i18n";
import type { Language, TranslationParams } from "./types";

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (id: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (id, params) => translate(language, id, params),
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}

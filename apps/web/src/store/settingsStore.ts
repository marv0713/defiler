import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "../i18n/types";

interface SettingsState {
  language: Language;
}

interface SettingsActions {
  setLanguage: (language: Language) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "warring-states-settings",
    },
  ),
);

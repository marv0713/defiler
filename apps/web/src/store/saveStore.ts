import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Profile {
  id: string;
  name: string;
}

interface SaveState {
  profiles: Profile[];
  currentProfileId: string;
  progress: Record<string, string[]>; // profileId -> completedLevelIds
  decks: Record<string, string[]>;    // profileId -> cardIds
}

interface SaveActions {
  setCurrentProfile: (id: string) => void;
  createProfile: (name: string) => string;
  createProfileWithId: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  markComplete: (levelId: string) => void;
  isComplete: (levelId: string) => boolean;
  getDeck: () => string[] | null;
  saveDeck: (deck: string[]) => void;
  reset: () => void;
}

type SaveStore = SaveState & SaveActions;

export const useSaveStore = create<SaveStore>()(
  persist(
    (set, get) => ({
      profiles: [{ id: "default", name: "Default Player" }],
      currentProfileId: "default",
      progress: { default: [] },
      decks: {},

      setCurrentProfile: (id) => set({ currentProfileId: id }),

      createProfile: (name) => {
        const id = `profile-${Date.now()}`;
        set((s) => ({
          profiles: [...s.profiles, { id, name }],
          progress: {
            ...s.progress,
            [id]: [],
          },
          decks: {
            ...s.decks,
          },
        }));
        return id;
      },

      createProfileWithId: (id, name) => {
        set((s) => {
          if (s.profiles.some((p) => p.id === id)) return {};
          return {
            profiles: [...s.profiles, { id, name }],
            progress: {
              ...s.progress,
              [id]: [],
            },
            decks: {
              ...s.decks,
            },
          };
        });
      },

      deleteProfile: (id) => {
        if (id === "default") return;
        set((s) => {
          const nextProfiles = s.profiles.filter((p) => p.id !== id);
          const nextCurrent = s.currentProfileId === id ? "default" : s.currentProfileId;
          const nextProgress = { ...s.progress };
          delete nextProgress[id];
          const nextDecks = { ...s.decks };
          delete nextDecks[id];
          return {
            profiles: nextProfiles,
            currentProfileId: nextCurrent,
            progress: nextProgress,
            decks: nextDecks,
          };
        });
      },

      markComplete: (levelId) => {
        const { currentProfileId, progress } = get();
        const currentProgress = progress[currentProfileId] ?? [];
        if (currentProgress.includes(levelId)) return;
        set({
          progress: {
            ...progress,
            [currentProfileId]: [...currentProgress, levelId],
          },
        });
      },

      isComplete: (levelId) => {
        const { currentProfileId, progress } = get();
        return (progress[currentProfileId] ?? []).includes(levelId);
      },

      getDeck: () => {
        const { currentProfileId, decks } = get();
        return decks[currentProfileId] ?? null;
      },

      saveDeck: (deck) => {
        const { currentProfileId, decks } = get();
        set({
          decks: {
            ...decks,
            [currentProfileId]: deck,
          },
        });
      },

      reset: () => {
        set({
          profiles: [{ id: "default", name: "Default Player" }],
          currentProfileId: "default",
          progress: { default: [] },
          decks: {},
        });
      },
    }),
    {
      name: "warring-states-save",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 && persistedState) {
          const completed = Array.isArray(persistedState.completedLevelIds)
            ? persistedState.completedLevelIds
            : [];
          return {
            profiles: [{ id: "default", name: "Default Player" }],
            currentProfileId: "default",
            progress: {
              default: completed,
            },
            decks: {},
          };
        }
        return persistedState;
      },
    },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SaveState {
  completedLevelIds: string[];
}

interface SaveActions {
  markComplete: (levelId: string) => void;
  isComplete: (levelId: string) => boolean;
  reset: () => void;
}

type SaveStore = SaveState & SaveActions;

export const useSaveStore = create<SaveStore>()(
  persist(
    (set, get) => ({
      completedLevelIds: [],

      markComplete: (levelId) =>
        set((s) => ({
          completedLevelIds: s.completedLevelIds.includes(levelId)
            ? s.completedLevelIds
            : [...s.completedLevelIds, levelId],
        })),

      isComplete: (levelId) => get().completedLevelIds.includes(levelId),

      reset: () => set({ completedLevelIds: [] }),
    }),
    {
      name: "warring-states-save",
    },
  ),
);

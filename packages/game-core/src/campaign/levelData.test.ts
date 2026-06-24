import { describe, expect, it } from "vitest";
import { CAMPAIGN_LEVELS } from "./levelData";

describe("CAMPAIGN_LEVELS", () => {
  it("keeps player deck constraints compatible with one-faction campaign decks", () => {
    for (const level of CAMPAIGN_LEVELS) {
      expect(level.deckConstraint.allowDuplicates).toBe(true);
      expect(level.deckConstraint.requiredFactions ?? []).toEqual([]);
      expect(level.deckConstraint.minFactions).toBeUndefined();
    }
  });
});

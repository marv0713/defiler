import { describe, expect, it } from "vitest";
import { INITIAL_CARDS } from "../index";
import type { CardDefinition, Faction } from "../index";

const MVP_FACTIONS: Faction[] = ["qin", "chu", "qi", "zhao"];

function countCardsForFaction(cards: CardDefinition[], faction: Faction): number {
  return cards.filter((card) => card.faction === faction).length;
}

describe("initial card data", () => {
  it("contains at least twelve cards for each MVP faction", () => {
    expect(INITIAL_CARDS.length).toBeGreaterThanOrEqual(60);

    for (const faction of MVP_FACTIONS) {
      expect(countCardsForFaction(INITIAL_CARDS, faction)).toBeGreaterThanOrEqual(
        12,
      );
    }
  });

  it("uses unique card ids", () => {
    const ids = INITIAL_CARDS.map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defines the required card fields for each card", () => {
    for (const card of INITIAL_CARDS) {
      expect(card.id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.englishName).toBeTruthy();
      expect(card.description).toBeTruthy();
      expect(card.tags).toEqual(expect.any(Array));
      expect(card.effects).toEqual(expect.any(Array));
      expect(card.budget).toEqual(expect.any(Number));
      expect(card.power).toBeGreaterThanOrEqual(0);

      if (card.type === "unit") {
        expect(card.row).toBeTruthy();
      }
    }
  });
});

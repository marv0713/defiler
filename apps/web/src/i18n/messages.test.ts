import { describe, expect, test } from "vitest";
import { INITIAL_CARDS } from "@warring-states/game-core";
import { enMessages } from "./messages.en";
import { zhMessages } from "./messages.zh";

describe("translation dictionaries", () => {
  test("Chinese dictionary has every English key", () => {
    const fallbackOnlyKeys = new Set(["debug.missingInZh"]);
    const missing = Object.keys(enMessages).filter(
      (key) => !fallbackOnlyKeys.has(key) && !(key in zhMessages),
    );
    expect(missing).toEqual([]);
  });

  test("card text ids exist in all dictionaries", () => {
    for (const card of INITIAL_CARDS) {
      expect(enMessages[card.nameTextId!]).toBeTruthy();
      expect(enMessages[card.descriptionTextId!]).toBeTruthy();
      expect(zhMessages[card.nameTextId!]).toBeTruthy();
      expect(zhMessages[card.descriptionTextId!]).toBeTruthy();
    }
  });
});

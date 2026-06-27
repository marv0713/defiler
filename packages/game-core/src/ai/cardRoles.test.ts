import { describe, expect, test } from "vitest";
import type { CardDefinition } from "../types";
import { classifyCardRoles } from "./cardRoles";

function card(overrides: Partial<CardDefinition>): CardDefinition {
  return {
    id: "test-card",
    name: "Test Card",
    type: "unit",
    faction: "qin",
    row: "melee",
    power: 4,
    rarity: "common",
    tags: [],
    effects: [],
    description: "Test Card",
    ...overrides,
  };
}

describe("classifyCardRoles", () => {
  test("classifies damage and destroy effects as removal", () => {
    expect(
      classifyCardRoles(
        card({
          effects: [{ type: "DAMAGE", target: { type: "ENEMY_LOWEST" }, amount: 3 }],
        }),
      ),
    ).toContain("removal");

    expect(
      classifyCardRoles(
        card({
          effects: [{ type: "DESTROY", target: { type: "ENEMY_LOWEST" } }],
        }),
      ),
    ).toContain("removal");
  });

  test("classifies row buffs and resource effects generically", () => {
    expect(
      classifyCardRoles(
        card({
          effects: [
            { type: "BUFF", target: { type: "ALLY_ROW", row: "melee" }, amount: 2 },
          ],
        }),
      ),
    ).toContain("row_buff");

    expect(
      classifyCardRoles(
        card({
          effects: [{ type: "DRAW_DISCARD", draw: 2, discard: 1 }],
        }),
      ),
    ).toContain("resource");
  });

  test("classifies high-rarity and high-power cards as finishers or tempo", () => {
    expect(classifyCardRoles(card({ rarity: "legend", power: 8 }))).toContain(
      "finisher",
    );
    expect(classifyCardRoles(card({ rarity: "common", power: 8 }))).toContain(
      "tempo",
    );
  });
});

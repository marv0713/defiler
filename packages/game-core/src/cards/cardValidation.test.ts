import { describe, expect, it } from "vitest";
import { INITIAL_CARDS, validateCards } from "../index";
import type { CardDefinition } from "../index";

function createValidCard(overrides: Partial<CardDefinition> = {}): CardDefinition {
  return {
    id: "test-card",
    name: "Test Card",
    englishName: "Test Card",
    faction: "qin",
    type: "unit",
    row: "melee",
    power: 4,
    rarity: "common",
    tags: [],
    effects: [],
    budget: 4,
    description: "A valid test card.",
    ...overrides,
  };
}

describe("validateCards", () => {
  it("passes for the current initial card data", () => {
    expect(validateCards(INITIAL_CARDS)).toEqual({
      valid: true,
      errors: [],
      warnings: [],
    });
  });

  it("detects duplicate card ids", () => {
    const result = validateCards([
      createValidCard({ id: "duplicate-card" }),
      createValidCard({ id: "duplicate-card", name: "Duplicate Card" }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Duplicate card id: duplicate-card");
  });

  it("detects unit cards without rows", () => {
    const card = createValidCard({
      id: "missing-row",
    });
    delete card.row;

    const result = validateCards([card]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Unit card missing row: missing-row");
  });

  it("detects invalid numeric and enum values", () => {
    const result = validateCards([
      createValidCard({
        id: "negative-power",
        power: -1,
      }),
      createValidCard({
        id: "unknown-faction",
        faction: "wei" as CardDefinition["faction"],
      }),
      createValidCard({
        id: "unknown-row",
        row: "river" as CardDefinition["row"],
      }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Card has negative power: negative-power");
    expect(result.errors).toContain("Card has unknown faction: unknown-faction");
    expect(result.errors).toContain("Card has unknown row: unknown-row");
  });

  it("detects unknown effect types", () => {
    const result = validateCards([
      createValidCard({
        id: "unknown-effect",
        effects: [
          { type: "UNKNOWN_EFFECT" } as unknown as CardDefinition["effects"][number],
        ],
      }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Card has unknown effect type UNKNOWN_EFFECT: unknown-effect",
    );
  });

  it("warns for missing budget or description without failing validation", () => {
    const missingBudget = createValidCard({ id: "missing-budget" });
    const missingDescription = createValidCard({
      id: "missing-description",
      description: "",
    });
    delete missingBudget.budget;

    const result = validateCards([missingBudget, missingDescription]);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      "Card missing budget: missing-budget",
      "Card missing nameTextId: missing-budget",
      "Card missing descriptionTextId: missing-budget",
      "Card missing description: missing-description",
      "Card missing nameTextId: missing-description",
      "Card missing descriptionTextId: missing-description",
    ]);
  });
});

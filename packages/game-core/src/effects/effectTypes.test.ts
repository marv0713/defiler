import { describe, expect, it } from "vitest";
import { EFFECT_TYPES } from "../index";
import type {
  CardDefinition,
  ConditionDefinition,
  EffectContext,
  EffectDefinition,
  TargetSelector,
} from "../index";

describe("effect type system", () => {
  it("exports all MVP effect type names", () => {
    expect(EFFECT_TYPES).toEqual([
      "BUFF",
      "DAMAGE",
      "DESTROY",
      "DRAW_DISCARD",
      "SUMMON",
      "REVIVE",
      "LOCK",
      "CLEAR_WEATHER",
      "CONDITIONAL_BOOST",
    ]);
  });

  it("supports typed effect definitions on card definitions", () => {
    const target: TargetSelector = {
      type: "ENEMY_LOWEST",
    };
    const condition: ConditionDefinition = {
      type: "SCORE_BEHIND",
    };
    const effects: EffectDefinition[] = [
      { type: "BUFF", target: { type: "ALLY_LOWEST" }, amount: 2 },
      { type: "DAMAGE", target: { type: "ENEMY_HIGHEST" }, amount: 3 },
      { type: "DESTROY", target },
      { type: "DRAW_DISCARD", draw: 2, discard: 1 },
      { type: "SUMMON", cardId: "chu-token", row: "melee", count: 1 },
      { type: "REVIVE", target: { type: "ALLY_LOWEST" }, maxPower: 4 },
      { type: "LOCK", target: { type: "ENEMY_RANDOM", count: 1 } },
      { type: "CLEAR_WEATHER" },
      { type: "CONDITIONAL_BOOST", condition, amount: 3 },
    ];
    const card: CardDefinition = {
      id: "effect-test-card",
      name: "Effect Test Card",
      englishName: "Effect Test Card",
      faction: "qin",
      type: "unit",
      row: "melee",
      power: 4,
      rarity: "elite",
      tags: [],
      effects,
      budget: 8,
      description: "A card used to prove typed effects compile.",
    };

    expect(card.effects.map((effect) => effect.type)).toEqual(EFFECT_TYPES);
  });

  it("defines effect context for deterministic effect resolution", () => {
    const context: EffectContext = {
      sourcePlayerId: "player",
      opponentPlayerId: "opponent",
      random: () => 0.5,
    };

    expect(context.random()).toBe(0.5);
  });
});

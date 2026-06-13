import { describe, it, expect } from "vitest";
import { resolveEffects } from "./effectResolver";
import type { GameState, CardInstance, EffectContext } from "../types";
import type { EffectDefinition, TargetSelector } from "./effectTypes";

function createCard(
  instanceId: string,
  ownerId: "player" | "opponent",
  power: number,
  row: "melee" | "ranged" | "siege" = "melee",
): CardInstance {
  return {
    instanceId,
    cardId: instanceId,
    ownerId,
    type: "unit",
    row,
    currentPower: power,
    basePower: power,
    isLocked: false,
    isDestroyed: false,
    modifiers: [],
  };
}

function createState(overrides?: Partial<GameState>): GameState {
  return {
    id: "test-game",
    seed: "test-seed",
    status: "playing",
    currentRound: 1,
    currentPlayerId: "player",
    players: {
      player: {
        id: "player",
        faction: "qin",
        deck: [],
        hand: [],
        board: {
          melee: [createCard("p-melee-1", "player", 5, "melee")],
          ranged: [],
          siege: [],
        },
        graveyard: [],
        hasPassed: false,
        roundWins: 0,
      },
      opponent: {
        id: "opponent",
        faction: "chu",
        deck: [],
        hand: [],
        board: {
          melee: [createCard("o-melee-1", "opponent", 8, "melee")],
          ranged: [],
          siege: [],
        },
        graveyard: [],
        hasPassed: false,
        roundWins: 0,
      },
    },
    actionLog: [],
    cardDefinitions: {},
    ...overrides,
  };
}

const mockContext: EffectContext = {
  sourcePlayerId: "player",
  opponentPlayerId: "opponent",
  random: () => 0.5,
};

describe("resolveEffects", () => {
  it("returns the same state when effects array is empty", () => {
    const state = createState();
    const result = resolveEffects(state, mockContext, []);
    expect(result).toBe(state);
  });

  describe("BUFF", () => {
    it("increases currentPower of the target", () => {
      const state = createState();
      const selector: TargetSelector = { type: "ENEMY_LOWEST" };
      const effects: EffectDefinition[] = [
        { type: "BUFF", target: selector, amount: 3 },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      // Enemy lowest is o-melee-1 (power 8) → buffed to 11
      const buffedCard = result.players.opponent.board.melee[0];
      expect(buffedCard.currentPower).toBe(11);
      expect(buffedCard.modifiers).toHaveLength(1);
      expect(buffedCard.modifiers[0].type).toBe("buff");
      expect(buffedCard.modifiers[0].amount).toBe(3);
      expect(buffedCard.modifiers[0].sourceCardInstanceId).toBe("source-card");
    });

    it("does not mutate the original state", () => {
      const state = createState();
      const selector: TargetSelector = { type: "ENEMY_LOWEST" };
      const effects: EffectDefinition[] = [
        { type: "BUFF", target: selector, amount: 3 },
      ];

      resolveEffects(state, mockContext, effects, "source-card");

      expect(state.players.opponent.board.melee[0].currentPower).toBe(8);
      expect(state.players.opponent.board.melee[0].modifiers).toEqual([]);
    });
  });

  describe("DAMAGE", () => {
    it("decreases currentPower of the target", () => {
      const state = createState();
      const selector: TargetSelector = { type: "ENEMY_HIGHEST" };
      const effects: EffectDefinition[] = [
        { type: "DAMAGE", target: selector, amount: 3 },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      // Enemy highest is o-melee-1 (power 8) → damaged to 5
      const damagedCard = result.players.opponent.board.melee[0];
      expect(damagedCard.currentPower).toBe(5);
      expect(damagedCard.modifiers).toHaveLength(1);
      expect(damagedCard.modifiers[0].type).toBe("damage");
      expect(damagedCard.modifiers[0].amount).toBe(-3);
    });

    it("does not reduce currentPower below 0", () => {
      const state = createState();
      const selector: TargetSelector = { type: "ENEMY_HIGHEST" };
      const effects: EffectDefinition[] = [
        { type: "DAMAGE", target: selector, amount: 100 },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      const damagedCard = result.players.opponent.board.melee[0];
      expect(damagedCard.currentPower).toBe(0);
    });

    it("does not mutate the original state", () => {
      const state = createState();
      const selector: TargetSelector = { type: "ENEMY_HIGHEST" };
      const effects: EffectDefinition[] = [
        { type: "DAMAGE", target: selector, amount: 3 },
      ];

      resolveEffects(state, mockContext, effects, "source-card");

      expect(state.players.opponent.board.melee[0].currentPower).toBe(8);
    });
  });

  describe("DESTROY", () => {
    it("removes the target from board and places it in graveyard as destroyed", () => {
      const state = createState();
      const selector: TargetSelector = { type: "ENEMY_LOWEST" };
      const effects: EffectDefinition[] = [
        { type: "DESTROY", target: selector },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      // Card is removed from board
      expect(result.players.opponent.board.melee).toHaveLength(0);
      // Card is in graveyard with isDestroyed = true
      expect(result.players.opponent.graveyard).toHaveLength(1);
      expect(result.players.opponent.graveyard[0].instanceId).toBe("o-melee-1");
      expect(result.players.opponent.graveyard[0].isDestroyed).toBe(true);
    });

    it("does not mutate the original state", () => {
      const state = createState();
      const selector: TargetSelector = { type: "ENEMY_LOWEST" };
      const effects: EffectDefinition[] = [
        { type: "DESTROY", target: selector },
      ];

      resolveEffects(state, mockContext, effects, "source-card");

      expect(state.players.opponent.board.melee).toHaveLength(1);
      expect(state.players.opponent.graveyard).toEqual([]);
    });

    it("ignores already destroyed cards", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [],
            hand: [],
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
          opponent: {
            id: "opponent",
            faction: "chu",
            deck: [],
            hand: [],
            board: {
              melee: [{ ...createCard("o-melee-1", "opponent", 8, "melee"), isDestroyed: true }],
              ranged: [],
              siege: [],
            },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });
      const selector: TargetSelector = { type: "ENEMY_LOWEST" };
      const effects: EffectDefinition[] = [
        { type: "DESTROY", target: selector },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      // Already destroyed, so no change — card stays on board (targetResolver ignores destroyed)
      expect(result.players.opponent.board.melee).toHaveLength(1);
      expect(result.players.opponent.graveyard).toEqual([]);
    });
  });

  describe("SUMMON", () => {
    it("creates a token on the specified row", () => {
      const state = createState({
        cardDefinitions: {
          "qin-token": {
            id: "qin-token",
            name: "Qin Token",
            englishName: "Qin Token",
            faction: "qin",
            type: "unit",
            row: "melee",
            power: 3,
            rarity: "common",
            tags: ["token"],
            effects: [],
            description: "A summoned token.",
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "SUMMON", cardId: "qin-token", row: "ranged", count: 1 },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      const rangedRow = result.players.player.board.ranged;
      expect(rangedRow).toHaveLength(1);
      expect(rangedRow[0].cardId).toBe("qin-token");
      expect(rangedRow[0].ownerId).toBe("player");
      expect(rangedRow[0].currentPower).toBe(3);
      expect(rangedRow[0].basePower).toBe(3);
      expect(rangedRow[0].type).toBe("unit");
      expect(rangedRow[0].row).toBe("ranged");
    });

    it("creates multiple tokens when count > 1", () => {
      const state = createState({
        cardDefinitions: {
          "qin-token": {
            id: "qin-token",
            name: "Qin Token",
            englishName: "Qin Token",
            faction: "qin",
            type: "unit",
            row: "melee",
            power: 2,
            rarity: "common",
            tags: ["token"],
            effects: [],
            description: "A summoned token.",
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "SUMMON", cardId: "qin-token", row: "melee", count: 3 },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      const meleeRow = result.players.player.board.melee;
      // Original p-melee-1 + 3 tokens = 4
      expect(meleeRow).toHaveLength(4);
      const tokens = meleeRow.filter((c) => c.cardId === "qin-token");
      expect(tokens).toHaveLength(3);
      tokens.forEach((t) => {
        expect(t.currentPower).toBe(2);
        expect(t.ownerId).toBe("player");
      });
    });

    it("does nothing when card definition is not found", () => {
      const state = createState();
      const effects: EffectDefinition[] = [
        { type: "SUMMON", cardId: "nonexistent", row: "melee", count: 1 },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      // No change — melee still has only p-melee-1
      expect(result.players.player.board.melee).toHaveLength(1);
    });

    it("does not mutate the original state", () => {
      const state = createState({
        cardDefinitions: {
          "qin-token": {
            id: "qin-token",
            name: "Qin Token",
            englishName: "Qin Token",
            faction: "qin",
            type: "unit",
            row: "melee",
            power: 3,
            rarity: "common",
            tags: ["token"],
            effects: [],
            description: "A summoned token.",
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "SUMMON", cardId: "qin-token", row: "ranged", count: 1 },
      ];

      resolveEffects(state, mockContext, effects, "source-card");

      expect(state.players.player.board.ranged).toEqual([]);
    });
  });

  describe("multiple effects in sequence", () => {
    it("applies effects in order", () => {
      const state = createState();
      // First damage the enemy (8 -> 6), then buff it (6 -> 10)
      const effects: EffectDefinition[] = [
        { type: "DAMAGE", target: { type: "ENEMY_HIGHEST" }, amount: 2 },
        { type: "BUFF", target: { type: "ENEMY_HIGHEST" }, amount: 4 },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      const card = result.players.opponent.board.melee[0];
      expect(card.currentPower).toBe(10); // 8 - 2 + 4
      expect(card.modifiers).toHaveLength(2);
      expect(card.modifiers[0].type).toBe("damage");
      expect(card.modifiers[1].type).toBe("buff");
    });
  });
});

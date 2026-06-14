import { describe, it, expect } from "vitest";
import { resolveEffects } from "./effectResolver";
import type { GameState, CardInstance } from "../types";
import type { EffectContext, EffectDefinition, TargetSelector } from "./effectTypes";

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

  describe("CONDITIONAL_BOOST", () => {
    it("boosts self when the score condition is met", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [],
            hand: [],
            board: {
              melee: [createCard("source-card", "player", 3, "melee")],
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
              melee: [createCard("enemy-card", "opponent", 8, "melee")],
              ranged: [],
              siege: [],
            },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const result = resolveEffects(
        state,
        mockContext,
        [
          {
            type: "CONDITIONAL_BOOST",
            condition: { type: "SCORE_BEHIND" },
            amount: 3,
          },
        ],
        "source-card",
      );

      expect(result.players.player.board.melee[0].currentPower).toBe(6);
      expect(result.players.player.board.melee[0].modifiers[0]).toEqual(
        expect.objectContaining({
          amount: 3,
          type: "buff",
          sourceCardInstanceId: "source-card",
        }),
      );
    });

    it("does nothing when the score condition is not met", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [],
            hand: [],
            board: {
              melee: [createCard("source-card", "player", 9, "melee")],
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
              melee: [createCard("enemy-card", "opponent", 4, "melee")],
              ranged: [],
              siege: [],
            },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const result = resolveEffects(
        state,
        mockContext,
        [
          {
            type: "CONDITIONAL_BOOST",
            condition: { type: "SCORE_BEHIND" },
            amount: 3,
          },
        ],
        "source-card",
      );

      expect(result).toBe(state);
    });

    it("supports opponent-passed and ally-count conditions", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [],
            hand: [],
            board: {
              melee: [
                createCard("source-card", "player", 3, "melee"),
                createCard("ally-1", "player", 2, "melee"),
              ],
              ranged: [createCard("ally-2", "player", 2, "ranged")],
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
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: true,
            roundWins: 0,
          },
        },
      });

      const result = resolveEffects(
        state,
        mockContext,
        [
          {
            type: "CONDITIONAL_BOOST",
            condition: { type: "OPPONENT_PASSED" },
            amount: 2,
          },
          {
            type: "CONDITIONAL_BOOST",
            condition: { type: "ALLY_UNIT_COUNT_AT_LEAST", count: 3 },
            amount: 1,
          },
        ],
        "source-card",
      );

      expect(result.players.player.board.melee[0].currentPower).toBe(6);
    });
  });

  describe("DRAW_DISCARD", () => {
    it("draws cards from deck and discards from end of hand", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [
              createCard("deck-1", "player", 3, "melee"),
              createCard("deck-2", "player", 4, "ranged"),
              createCard("deck-3", "player", 5, "siege"),
            ],
            hand: [
              createCard("hand-1", "player", 1, "melee"),
              createCard("hand-2", "player", 2, "melee"),
            ],
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
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "DRAW_DISCARD", draw: 2, discard: 1 },
      ];

      const result = resolveEffects(state, mockContext, effects);

      // Drew 2 from deck: deck-1, deck-2 → hand becomes [hand-1, hand-2, deck-1, deck-2]
      // Discard 1 from end: deck-2 → graveyard
      expect(result.players.player.deck).toHaveLength(1);
      expect(result.players.player.deck[0].instanceId).toBe("deck-3");
      expect(result.players.player.hand).toHaveLength(3); // hand-1, hand-2, deck-1
      expect(result.players.player.graveyard).toHaveLength(1);
      expect(result.players.player.graveyard[0].instanceId).toBe("deck-2");
    });

    it("handles draw from empty deck and discard from empty hand", () => {
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
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "DRAW_DISCARD", draw: 3, discard: 2 },
      ];

      const result = resolveEffects(state, mockContext, effects);

      expect(result.players.player.deck).toEqual([]);
      expect(result.players.player.hand).toEqual([]);
      expect(result.players.player.graveyard).toEqual([]);
    });

    it("does not mutate the original state", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [createCard("deck-1", "player", 3, "melee")],
            hand: [createCard("hand-1", "player", 1, "melee")],
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
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "DRAW_DISCARD", draw: 1, discard: 1 },
      ];

      resolveEffects(state, mockContext, effects);

      expect(state.players.player.deck).toHaveLength(1);
      expect(state.players.player.hand).toHaveLength(1);
      expect(state.players.player.graveyard).toEqual([]);
    });
  });

  describe("REVIVE", () => {
    it("revives the lowest-power ally card from graveyard to board", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [],
            hand: [],
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [
              { ...createCard("g1", "player", 5, "melee"), isDestroyed: true },
              { ...createCard("g2", "player", 2, "ranged"), isDestroyed: true },
              { ...createCard("g3", "player", 8, "siege"), isDestroyed: true },
            ],
            hasPassed: false,
            roundWins: 0,
          },
          opponent: {
            id: "opponent",
            faction: "chu",
            deck: [],
            hand: [],
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "REVIVE", target: { type: "ALLY_LOWEST" } },
      ];

      const result = resolveEffects(state, mockContext, effects);

      // g2 (power 2, ranged) should be revived
      expect(result.players.player.graveyard).toHaveLength(2);
      expect(result.players.player.board.ranged).toHaveLength(1);
      const revived = result.players.player.board.ranged[0];
      expect(revived.instanceId).toBe("g2");
      expect(revived.isDestroyed).toBe(false);
    });

    it("filters by maxPower when specified", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [],
            hand: [],
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [
              { ...createCard("g1", "player", 5, "melee"), isDestroyed: true },
              { ...createCard("g2", "player", 2, "ranged"), isDestroyed: true },
            ],
            hasPassed: false,
            roundWins: 0,
          },
          opponent: {
            id: "opponent",
            faction: "chu",
            deck: [],
            hand: [],
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "REVIVE", target: { type: "ALLY_LOWEST" }, maxPower: 3 },
      ];

      const result = resolveEffects(state, mockContext, effects);

      // Only g2 (power 2 ≤ 3) is eligible
      expect(result.players.player.graveyard).toHaveLength(1);
      expect(result.players.player.board.ranged).toHaveLength(1);
      expect(result.players.player.board.ranged[0].instanceId).toBe("g2");
    });

    it("returns state unchanged when no eligible cards in graveyard", () => {
      const state = createState();
      const effects: EffectDefinition[] = [
        { type: "REVIVE", target: { type: "ALLY_LOWEST" } },
      ];

      const result = resolveEffects(state, mockContext, effects);
      expect(result).toBe(state);
    });

    it("tie-break: revives the earliest graveyard entry when multiple cards share the lowest power", () => {
      const state = createState({
        players: {
          player: {
            id: "player",
            faction: "qin",
            deck: [],
            hand: [],
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [
              { ...createCard("g1", "player", 2, "melee"), isDestroyed: true },
              { ...createCard("g2", "player", 2, "ranged"), isDestroyed: true },
            ],
            hasPassed: false,
            roundWins: 0,
          },
          opponent: {
            id: "opponent",
            faction: "chu",
            deck: [],
            hand: [],
            board: { melee: [], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "REVIVE", target: { type: "ALLY_LOWEST" } },
      ];

      const result = resolveEffects(state, mockContext, effects);

      // g1 and g2 both have power 2; g1 entered graveyard first so it is revived
      expect(result.players.player.graveyard).toHaveLength(1);
      expect(result.players.player.graveyard[0].instanceId).toBe("g2");
      expect(result.players.player.board.melee).toHaveLength(1);
      expect(result.players.player.board.melee[0].instanceId).toBe("g1");
    });
  });

  describe("LOCK", () => {
    it("sets isLocked to true on the target", () => {
      const state = createState();
      const effects: EffectDefinition[] = [
        { type: "LOCK", target: { type: "ENEMY_HIGHEST" } },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");

      const locked = result.players.opponent.board.melee[0];
      expect(locked.isLocked).toBe(true);
    });

    it("does not mutate the original state", () => {
      const state = createState();
      const effects: EffectDefinition[] = [
        { type: "LOCK", target: { type: "ENEMY_HIGHEST" } },
      ];

      resolveEffects(state, mockContext, effects, "source-card");

      expect(state.players.opponent.board.melee[0].isLocked).toBe(false);
    });

    it("respects existing isLocked state (already locked stays locked)", () => {
      const alreadyLocked = { ...createCard("o-melee-1", "opponent", 8, "melee"), isLocked: true };
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
            board: { melee: [alreadyLocked], ranged: [], siege: [] },
            graveyard: [],
            hasPassed: false,
            roundWins: 0,
          },
        },
      });

      const effects: EffectDefinition[] = [
        { type: "LOCK", target: { type: "ENEMY_HIGHEST" } },
      ];

      const result = resolveEffects(state, mockContext, effects, "source-card");
      expect(result.players.opponent.board.melee[0].isLocked).toBe(true);
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  createInitialGameState,
  shuffleWithSeed,
  STARTING_HAND_SIZE,
} from "../index";
import type { CardDefinition } from "../index";

function createUnitCard(id: string, power: number): CardDefinition {
  return {
    id,
    name: id,
    englishName: id,
    faction: "qin",
    type: "unit",
    row: "melee",
    power,
    rarity: "common",
    tags: [],
    effects: [],
    description: id,
  };
}

function createDeck(prefix: string): CardDefinition[] {
  return Array.from({ length: 12 }, (_, index) =>
    createUnitCard(`${prefix}-${index + 1}`, index + 1),
  );
}

describe("createInitialGameState", () => {
  it("creates shuffled hands, remaining decks, and empty player zones", () => {
    const playerDeck = createDeck("player-card");
    const opponentDeck = createDeck("opponent-card");
    const originalPlayerDeck = [...playerDeck];
    const originalOpponentDeck = [...opponentDeck];

    const state = createInitialGameState({
      seed: "opening-seed",
      playerFaction: "qin",
      opponentFaction: "chu",
      playerDeck,
      opponentDeck,
      firstPlayerId: "player",
    });

    const expectedPlayerOrder = shuffleWithSeed(
      playerDeck.map((card, index) => ({
        instanceId: `player-${card.id}-${index}`,
        cardId: card.id,
        ownerId: "player" as const,
        type: card.type,
        row: card.row,
        currentPower: card.power,
        basePower: card.power,
        isLocked: false,
        isDestroyed: false,
        modifiers: [],
      })),
      "opening-seed-player",
    );

    expect(state.seed).toBe("opening-seed");
    expect(state.status).toBe("playing");
    expect(state.currentRound).toBe(1);
    expect(state.currentPlayerId).toBe("player");
    expect(state.players.player.faction).toBe("qin");
    expect(state.players.opponent.faction).toBe("chu");
    expect(state.players.player.hand).toEqual(
      expectedPlayerOrder.slice(0, STARTING_HAND_SIZE),
    );
    expect(state.players.player.deck).toEqual(
      expectedPlayerOrder.slice(STARTING_HAND_SIZE),
    );
    expect(state.players.opponent.hand).toHaveLength(STARTING_HAND_SIZE);
    expect(state.players.opponent.deck).toHaveLength(
      opponentDeck.length - STARTING_HAND_SIZE,
    );
    expect(state.players.player.board).toEqual({
      melee: [],
      ranged: [],
      siege: [],
    });
    expect(state.players.opponent.board).toEqual({
      melee: [],
      ranged: [],
      siege: [],
    });
    expect(state.players.player.graveyard).toEqual([]);
    expect(state.players.opponent.graveyard).toEqual([]);
    expect(state.players.player.hasPassed).toBe(false);
    expect(state.players.opponent.hasPassed).toBe(false);
    expect(state.players.player.roundWins).toBe(0);
    expect(state.players.opponent.roundWins).toBe(0);
    expect(state.actionLog).toEqual([]);
    expect(playerDeck).toEqual(originalPlayerDeck);
    expect(opponentDeck).toEqual(originalOpponentDeck);
  });
});

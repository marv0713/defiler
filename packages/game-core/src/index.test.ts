import { describe, expect, it } from "vitest";
import {
  FACTIONS,
  GAME_CORE_VERSION,
  MAX_ROUND_WINS,
  ROWS,
  STARTING_HAND_SIZE,
} from "./index";
import type {
  CardDefinition,
  CardInstance,
  GameState,
  PlayerState,
  PowerModifier,
} from "./index";

describe("game-core package", () => {
  it("exposes the current scaffold version", () => {
    expect(GAME_CORE_VERSION).toBe("0.0.0");
  });

  it("exports serializable core game state types", () => {
    const modifier: PowerModifier = {
      id: "mod-1",
      amount: 2,
      type: "buff",
      expiresAt: "round_end",
    };

    const cardDefinition: CardDefinition = {
      id: "qin-infantry",
      name: "Qin Infantry",
      englishName: "Qin Infantry",
      faction: "qin",
      type: "unit",
      row: "melee",
      power: 4,
      rarity: "common",
      tags: ["soldier"],
      effects: [],
      description: "A basic Qin front-line unit.",
    };

    const cardInstance: CardInstance = {
      instanceId: "instance-1",
      cardId: cardDefinition.id,
      ownerId: "player",
      type: cardDefinition.type,
      row: cardDefinition.row,
      currentPower: cardDefinition.power + modifier.amount,
      basePower: cardDefinition.power,
      isLocked: false,
      isDestroyed: false,
      modifiers: [modifier],
    };

    const player: PlayerState = {
      id: "player",
      faction: "qin",
      deck: [],
      hand: [cardInstance],
      board: {
        melee: [],
        ranged: [],
        siege: [],
      },
      graveyard: [],
      hasPassed: false,
      roundWins: 0,
    };

    const opponent: PlayerState = {
      ...player,
      id: "opponent",
      faction: "chu",
      hand: [],
    };

    const state: GameState = {
      id: "game-1",
      seed: "seed-1",
      status: "playing",
      currentRound: 1,
      currentPlayerId: "player",
      players: {
        player,
        opponent,
      },
      actionLog: [],
      cardDefinitions: {},
    };

    expect(state.players.player.hand[0]?.currentPower).toBe(6);
  });

  it("exports shared game constants", () => {
    expect(ROWS).toEqual(["melee", "ranged", "siege"]);
    expect(FACTIONS).toEqual(["qin", "chu", "qi", "zhao", "neutral"]);
    expect(STARTING_HAND_SIZE).toBe(10);
    expect(MAX_ROUND_WINS).toBe(2);
  });
});

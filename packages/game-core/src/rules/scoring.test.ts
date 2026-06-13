import { describe, expect, it } from "vitest";
import {
  calculatePlayerScore,
  calculateRowScore,
  calculateScores,
} from "../index";
import type { CardInstance, GameState, PlayerState, Row } from "../index";

function createCard(
  instanceId: string,
  currentPower: number,
  isDestroyed = false,
): CardInstance {
  return {
    instanceId,
    cardId: instanceId,
    ownerId: "player",
    type: "unit",
    row: "melee",
    currentPower,
    basePower: currentPower,
    isLocked: false,
    isDestroyed,
    modifiers: [],
  };
}

function createPlayer(
  id: PlayerState["id"],
  rows: Partial<Record<Row, CardInstance[]>>,
): PlayerState {
  return {
    id,
    faction: id === "player" ? "qin" : "chu",
    deck: [],
    hand: [],
    board: {
      melee: rows.melee ?? [],
      ranged: rows.ranged ?? [],
      siege: rows.siege ?? [],
    },
    graveyard: [],
    hasPassed: false,
    roundWins: 0,
  };
}

describe("scoring", () => {
  it("calculates row scores from current power and ignores destroyed cards", () => {
    expect(calculateRowScore([])).toBe(0);
    expect(
      calculateRowScore([
        createCard("infantry", 5),
        createCard("damaged-cavalry", 2),
        createCard("destroyed-archer", 8, true),
      ]),
    ).toBe(7);
  });

  it("calculates a player's score across all rows", () => {
    const player = createPlayer("player", {
      melee: [createCard("melee-1", 4)],
      ranged: [createCard("ranged-1", 6), createCard("ranged-2", 3, true)],
      siege: [createCard("siege-1", 7)],
    });

    expect(calculatePlayerScore(player)).toBe(17);
  });

  it("calculates scores for both players", () => {
    const player = createPlayer("player", {
      melee: [createCard("player-melee", 4)],
      siege: [createCard("player-siege", 5)],
    });
    const opponent = createPlayer("opponent", {
      ranged: [createCard("opponent-ranged", 8)],
    });
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

    expect(calculateScores(state)).toEqual({
      player: 9,
      opponent: 8,
    });
  });
});

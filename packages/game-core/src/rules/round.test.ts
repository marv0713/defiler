import { describe, expect, it } from "vitest";
import { settleRound, startNextRound } from "../index";
import type { CardInstance, GameState, PlayerId, PlayerState, Row } from "../index";

function createCard(instanceId: string, currentPower: number): CardInstance {
  return {
    instanceId,
    cardId: instanceId,
    ownerId: "player",
    type: "unit",
    row: "melee",
    currentPower,
    basePower: currentPower,
    isLocked: false,
    isDestroyed: false,
    modifiers: [],
  };
}

function createPlayer(
  id: PlayerId,
  rows: Partial<Record<Row, CardInstance[]>>,
  roundWins = 0,
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
    hasPassed: true,
    roundWins,
  };
}

function createState(player: PlayerState, opponent: PlayerState): GameState {
  return {
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
}

describe("round flow", () => {
  it("settles a round and increments the higher scoring player's wins", () => {
    const state = createState(
      createPlayer("player", {
        melee: [createCard("player-card", 8)],
      }),
      createPlayer("opponent", {
        ranged: [createCard("opponent-card", 5)],
      }),
    );

    const nextState = settleRound(state);

    expect(nextState.status).toBe("round_finished");
    expect(nextState.roundWinnerId).toBe("player");
    expect(nextState.players.player.roundWins).toBe(1);
    expect(nextState.players.opponent.roundWins).toBe(0);
  });

  it("finishes the match when a player reaches two round wins", () => {
    const state = createState(
      createPlayer(
        "player",
        {
          melee: [createCard("player-card", 8)],
        },
        1,
      ),
      createPlayer("opponent", {
        ranged: [createCard("opponent-card", 5)],
      }),
    );

    const nextState = settleRound(state);

    expect(nextState.status).toBe("game_finished");
    expect(nextState.winnerId).toBe("player");
    expect(nextState.players.player.roundWins).toBe(2);
  });

  it("starts the next round by moving board cards to graveyard and clearing pass state", () => {
    const state = settleRound(
      createState(
        createPlayer("player", {
          melee: [createCard("player-card", 8)],
        }),
        createPlayer("opponent", {
          ranged: [createCard("opponent-card", 5)],
        }),
      ),
    );

    const nextState = startNextRound(state);

    expect(nextState.status).toBe("playing");
    expect(nextState.currentRound).toBe(2);
    expect(nextState.currentPlayerId).toBe("player");
    expect(nextState.roundWinnerId).toBeUndefined();
    expect(nextState.players.player.board.melee).toEqual([]);
    expect(nextState.players.opponent.board.ranged).toEqual([]);
    expect(nextState.players.player.graveyard).toEqual([
      expect.objectContaining({
        instanceId: "player-card",
      }),
    ]);
    expect(nextState.players.opponent.graveyard).toEqual([
      expect.objectContaining({
        instanceId: "opponent-card",
      }),
    ]);
    expect(nextState.players.player.hasPassed).toBe(false);
    expect(nextState.players.opponent.hasPassed).toBe(false);
  });
});

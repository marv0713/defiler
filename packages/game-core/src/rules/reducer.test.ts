import { describe, expect, it } from "vitest";
import { applyAction } from "../index";
import type { CardInstance, GameState, PlayerId, PlayerState, Row } from "../index";

function createCard(
  instanceId: string,
  type: CardInstance["type"],
  row?: Row,
): CardInstance {
  return {
    instanceId,
    cardId: instanceId,
    ownerId: "player",
    type,
    row,
    currentPower: type === "unit" ? 4 : 0,
    basePower: type === "unit" ? 4 : 0,
    isLocked: false,
    isDestroyed: false,
    modifiers: [],
  };
}

function createPlayer(id: PlayerId, hand: CardInstance[]): PlayerState {
  return {
    id,
    faction: id === "player" ? "qin" : "chu",
    deck: [],
    hand: hand.map((card) => ({
      ...card,
      ownerId: id,
    })),
    board: {
      melee: [],
      ranged: [],
      siege: [],
    },
    graveyard: [],
    hasPassed: false,
    roundWins: 0,
  };
}

function createState(playerHand: CardInstance[]): GameState {
  return {
    id: "game-1",
    seed: "seed-1",
    status: "playing",
    currentRound: 1,
    currentPlayerId: "player",
    players: {
      player: createPlayer("player", playerHand),
      opponent: createPlayer("opponent", []),
    },
    actionLog: [],
  };
}

describe("applyAction", () => {
  it("plays a unit card to its row without mutating the original state", () => {
    const state = createState([createCard("unit-1", "unit", "melee")]);

    const nextState = applyAction(state, {
      type: "PLAY_CARD",
      playerId: "player",
      cardInstanceId: "unit-1",
      target: {
        type: "row",
        playerId: "player",
        row: "melee",
      },
    });

    expect(state.players.player.hand).toHaveLength(1);
    expect(state.players.player.board.melee).toEqual([]);
    expect(nextState.players.player.hand).toEqual([]);
    expect(nextState.players.player.board.melee).toEqual([
      expect.objectContaining({
        instanceId: "unit-1",
      }),
    ]);
    expect(nextState.currentPlayerId).toBe("opponent");
    expect(nextState.actionLog).toHaveLength(1);
  });

  it("plays a special card to graveyard", () => {
    const state = createState([createCard("special-1", "special")]);

    const nextState = applyAction(state, {
      type: "PLAY_CARD",
      playerId: "player",
      cardInstanceId: "special-1",
    });

    expect(nextState.players.player.hand).toEqual([]);
    expect(nextState.players.player.graveyard).toEqual([
      expect.objectContaining({
        instanceId: "special-1",
      }),
    ]);
    expect(nextState.currentPlayerId).toBe("opponent");
  });

  it("passes and switches turn when the opponent has not passed", () => {
    const state = createState([]);

    const nextState = applyAction(state, {
      type: "PASS",
      playerId: "player",
    });

    expect(state.players.player.hasPassed).toBe(false);
    expect(nextState.players.player.hasPassed).toBe(true);
    expect(nextState.currentPlayerId).toBe("opponent");
    expect(nextState.actionLog).toHaveLength(1);
  });

  it("settles the round when both players have passed", () => {
    const state: GameState = {
      ...createState([]),
      currentPlayerId: "player",
      players: {
        player: {
          ...createPlayer("player", []),
          board: {
            melee: [createCard("player-unit", "unit", "melee")],
            ranged: [],
            siege: [],
          },
        },
        opponent: {
          ...createPlayer("opponent", []),
          hasPassed: true,
        },
      },
    };

    const nextState = applyAction(state, {
      type: "PASS",
      playerId: "player",
    });

    expect(nextState.status).toBe("round_finished");
    expect(nextState.roundWinnerId).toBe("player");
    expect(nextState.players.player.roundWins).toBe(1);
  });

  it("starts the next round through the reducer", () => {
    const roundFinishedState: GameState = {
      ...createState([]),
      status: "round_finished",
      roundWinnerId: "player",
      players: {
        player: {
          ...createPlayer("player", []),
          board: {
            melee: [createCard("player-unit", "unit", "melee")],
            ranged: [],
            siege: [],
          },
          hasPassed: true,
          roundWins: 1,
        },
        opponent: {
          ...createPlayer("opponent", []),
          hasPassed: true,
        },
      },
    };

    const nextState = applyAction(roundFinishedState, {
      type: "START_NEXT_ROUND",
    });

    expect(nextState.status).toBe("playing");
    expect(nextState.currentRound).toBe(2);
    expect(nextState.players.player.board.melee).toEqual([]);
    expect(nextState.players.player.graveyard).toEqual([
      expect.objectContaining({
        instanceId: "player-unit",
      }),
    ]);
    expect(nextState.actionLog).toHaveLength(1);
  });
});

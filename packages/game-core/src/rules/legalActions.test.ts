import { describe, expect, it } from "vitest";
import { getLegalActions } from "../index";
import type {
  CardInstance,
  CardType,
  GameState,
  PlayerId,
  PlayerState,
  Row,
} from "../index";

function createCard(
  instanceId: string,
  type: CardType,
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

function createPlayer(
  id: PlayerId,
  hand: CardInstance[],
  hasPassed = false,
): PlayerState {
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
    hasPassed,
    roundWins: 0,
  };
}

function createState(
  player: PlayerState,
  opponent: PlayerState,
  currentPlayerId: PlayerId,
  status: GameState["status"] = "playing",
): GameState {
  return {
    id: "game-1",
    seed: "seed-1",
    status,
    currentRound: 1,
    currentPlayerId,
    players: {
      player,
      opponent,
    },
    actionLog: [],
  };
}

describe("getLegalActions", () => {
  it("returns no actions when it is not the player's turn", () => {
    const state = createState(
      createPlayer("player", [createCard("unit-1", "unit", "melee")]),
      createPlayer("opponent", []),
      "opponent",
    );

    expect(getLegalActions(state, "player")).toEqual([]);
  });

  it("returns no actions for a player who has passed", () => {
    const state = createState(
      createPlayer("player", [createCard("unit-1", "unit", "melee")], true),
      createPlayer("opponent", []),
      "player",
    );

    expect(getLegalActions(state, "player")).toEqual([]);
  });

  it("returns no actions while the game is not playing", () => {
    const state = createState(
      createPlayer("player", [createCard("unit-1", "unit", "melee")]),
      createPlayer("opponent", []),
      "player",
      "round_finished",
    );

    expect(getLegalActions(state, "player")).toEqual([]);
  });

  it("returns pass and playable hand actions for the active player", () => {
    const state = createState(
      createPlayer("player", [
        createCard("unit-1", "unit", "melee"),
        createCard("special-1", "special"),
      ]),
      createPlayer("opponent", []),
      "player",
    );

    expect(getLegalActions(state, "player")).toEqual([
      {
        type: "PASS",
        playerId: "player",
      },
      {
        type: "PLAY_CARD",
        playerId: "player",
        cardInstanceId: "unit-1",
        target: {
          type: "row",
          playerId: "player",
          row: "melee",
        },
      },
      {
        type: "PLAY_CARD",
        playerId: "player",
        cardInstanceId: "special-1",
      },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import type {
  ActionTarget,
  GameAction,
  PassAction,
  PlayCardAction,
  RestartGameAction,
  StartNextRoundAction,
} from "../index";

function getActionType(action: GameAction): GameAction["type"] {
  return action.type;
}

describe("game action types", () => {
  it("supports play, pass, next-round, and restart actions", () => {
    const target: ActionTarget = {
      type: "row",
      playerId: "player",
      row: "melee",
    };

    const playCard: PlayCardAction = {
      type: "PLAY_CARD",
      playerId: "player",
      cardInstanceId: "card-1",
      target,
    };

    const pass: PassAction = {
      type: "PASS",
      playerId: "opponent",
    };

    const startNextRound: StartNextRoundAction = {
      type: "START_NEXT_ROUND",
    };

    const restart: RestartGameAction = {
      type: "RESTART_GAME",
    };

    expect([
      getActionType(playCard),
      getActionType(pass),
      getActionType(startNextRound),
      getActionType(restart),
    ]).toEqual(["PLAY_CARD", "PASS", "START_NEXT_ROUND", "RESTART_GAME"]);
  });
});

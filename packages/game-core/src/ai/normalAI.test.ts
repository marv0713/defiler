import { describe, expect, test } from "vitest";
import { getLegalActions } from "../rules/legalActions";
import { chooseNormalAIAction, scoreNormalAIAction } from "./normalAI";
import {
  makeTestCard,
  makeTestPlayer,
  makeTestState,
} from "./aiTestHelpers";

describe("chooseNormalAIAction", () => {
  test("returns a legal action", () => {
    const state = makeTestState(
      makeTestPlayer("player"),
      makeTestPlayer("opponent", [makeTestCard("o-hand", 5)]),
    );

    const action = chooseNormalAIAction(state, "opponent");
    expect(getLegalActions(state, "opponent")).toContainEqual(action);
  });

  test("passes when opponent has passed and AI is ahead", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 4, "player")], true),
      makeTestPlayer("opponent", [makeTestCard("o-hand", 8)], [
        makeTestCard("o-board", 9),
      ]),
    );

    expect(chooseNormalAIAction(state, "opponent").type).toBe("PASS");
  });

  test("passes when behind by too much and catching up is expensive", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 14, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-h1", 5),
        makeTestCard("o-h2", 4),
        makeTestCard("o-h3", 4),
      ]),
      1,
    );

    expect(chooseNormalAIAction(state, "opponent").type).toBe("PASS");
  });

  test("plays when slightly behind and one cheap card can overtake", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 6, "player")]),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 7)], [
        makeTestCard("o-board", 2),
      ]),
      1,
    );

    const action = chooseNormalAIAction(state, "opponent");
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-h1");
    }
  });

  test("passes after exceeding early-round card budget", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 8, "player")]),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 5)], [
        makeTestCard("o-board", 7),
      ]),
      1,
    );
    state.actionLog = [
      { id: "1", message: "PLAY_CARD", playerId: "opponent", round: 1 },
      { id: "2", message: "PLAY_CARD", playerId: "opponent", round: 1 },
      { id: "3", message: "PLAY_CARD", playerId: "opponent", round: 1 },
      { id: "4", message: "PLAY_CARD", playerId: "opponent", round: 1 },
    ];

    expect(chooseNormalAIAction(state, "opponent").type).toBe("PASS");
  });

  test("is more willing to spend cards in round 3", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 8, "player")], false, 1),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 7)], [
        makeTestCard("o-board", 2),
      ], false, 1),
      3,
    );
    state.actionLog = [
      { id: "1", message: "PLAY_CARD", playerId: "opponent", round: 3 },
      { id: "2", message: "PLAY_CARD", playerId: "opponent", round: 3 },
      { id: "3", message: "PLAY_CARD", playerId: "opponent", round: 3 },
      { id: "4", message: "PLAY_CARD", playerId: "opponent", round: 3 },
    ];

    expect(chooseNormalAIAction(state, "opponent").type).toBe("PLAY_CARD");
  });
});

describe("scoreNormalAIAction", () => {
  test("returns a score breakdown for inspection", () => {
    const state = makeTestState(
      makeTestPlayer("player"),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 5)]),
    );
    const action = getLegalActions(state, "opponent").find(
      (legalAction) => legalAction.type === "PLAY_CARD",
    );

    expect(action).toBeDefined();
    if (!action) return;

    const score = scoreNormalAIAction(state, action, "opponent");
    expect(score.action).toEqual(action);
    expect(Number.isFinite(score.total)).toBe(true);
    expect(Number.isFinite(score.cardCost)).toBe(true);
  });
});

import { describe, expect, test } from "vitest";
import { getLegalActions } from "../rules/legalActions";
import { makeTestCard, makeTestPlayer, makeTestState } from "./aiTestHelpers";
import { chooseAIAction, getAIStrategy } from "./aiStrategy";

describe("AI strategy registry", () => {
  test("utility-v1 returns a legal action through the strategy interface", () => {
    const state = makeTestState(
      makeTestPlayer("player"),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 5)]),
    );

    const action = chooseAIAction({
      aiId: "utility-v1",
      state,
      playerId: "opponent",
    });

    expect(getLegalActions(state, "opponent")).toContainEqual(action);
  });

  test("registry exposes all planned 8.1 AI ids", () => {
    expect(getAIStrategy("utility-v1").id).toBe("utility-v1");
    expect(getAIStrategy("round-strategy").id).toBe("round-strategy");
    expect(getAIStrategy("lookahead-1ply").id).toBe("lookahead-1ply");
  });

  test("lookahead-1ply returns a legal action", () => {
    const state = makeTestState(
      makeTestPlayer("player", [makeTestCard("p-h1", 5)]),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 5)]),
    );

    const action = chooseAIAction({
      aiId: "lookahead-1ply",
      state,
      playerId: "opponent",
    });

    expect(getLegalActions(state, "opponent")).toContainEqual(action);
  });
});

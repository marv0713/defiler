import { describe, expect, test } from "vitest";
import { makeTestCard, makeTestPlayer, makeTestState } from "./aiTestHelpers";
import { chooseRoundStrategyAIAction, getRoundPlan } from "./roundStrategyAI";

describe("round-strategy AI", () => {
  test("uses the cheapest catch-up card when opponent has passed", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 10, "player")], true),
      makeTestPlayer(
        "opponent",
        [makeTestCard("o-small", 3), makeTestCard("o-big", 9)],
        [makeTestCard("o-board", 8)],
      ),
      1,
    );

    const action = chooseRoundStrategyAIAction(state, "opponent");
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-small");
    }
  });

  test("concedes round 1 when catch-up requires too many cards", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 18, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-a", 4),
        makeTestCard("o-b", 4),
        makeTestCard("o-c", 4),
      ]),
      1,
    );

    expect(getRoundPlan(state, "opponent").plan).toBe("concede_round");
    expect(chooseRoundStrategyAIAction(state, "opponent").type).toBe("PASS");
  });

  test("plays in round 3 instead of conserving hand", () => {
    const state = makeTestState(
      makeTestPlayer(
        "player",
        [],
        [makeTestCard("p-board", 9, "player")],
        false,
        1,
      ),
      makeTestPlayer("opponent", [makeTestCard("o-finisher", 10)], [], false, 1),
      3,
    );

    expect(getRoundPlan(state, "opponent").plan).toBe("final_all_in");
    expect(chooseRoundStrategyAIAction(state, "opponent").type).toBe("PLAY_CARD");
  });
});

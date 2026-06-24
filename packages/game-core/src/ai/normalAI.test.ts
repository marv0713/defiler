import { describe, expect, test } from "vitest";
import { getLegalActions } from "../rules/legalActions";
import { chooseNormalAIAction, scoreNormalAIAction } from "./normalAI";
import {
  makeTestCard,
  makeTestPlayer,
  makeTestState,
} from "./aiTestHelpers";
import {
  getAIWeightsForDifficulty,
  EASY_AI_WEIGHTS,
  NORMAL_AI_WEIGHTS,
  HARD_AI_WEIGHTS,
} from "./aiEvaluation";

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

  test("chooseNormalAIAction chooses kill-shot action over non-killing play", () => {
    // We create a custom test state where opponent has two cards in hand.
    // Card A is "o-kill": deals 3 damage to ENEMY_LOWEST (kills a 3-power unit).
    // Card B is "o-normal": is just a white unit with 7 power.
    // We compare which card the AI chooses to play.
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-target", 3, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-kill", 4),
        makeTestCard("o-normal", 7),
      ]),
      1,
    );
    state.cardDefinitions["o-kill"] = {
      id: "o-kill",
      name: "Dmg unit",
      type: "unit",
      row: "melee",
      power: 3,
      rarity: "common",
      effects: [{ type: "DAMAGE", target: { type: "ENEMY_LOWEST" }, amount: 3 }],
    };
    state.cardDefinitions["o-normal"] = {
      id: "o-normal",
      name: "Vanilla unit",
      type: "unit",
      row: "melee",
      power: 7,
      rarity: "common",
      effects: [],
    };

    // Card B (7 power vanilla) gives 7 net points on board.
    // Card A (3 power + 3 damage kill) gives 3 + 3 = 6 net points on board, but gets the Kill Shot bonus (+4 points).
    // Total value of A: 6 + 4 = 10 points.
    // So the AI should choose "o-kill"!
    const action = chooseNormalAIAction(state, "opponent", NORMAL_AI_WEIGHTS);
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-kill");
    }
  });

  test("chooseNormalAIAction prefers playing units before applying row-buffs", () => {
    // Opponent has a row buff card ("o-buff": buff melee row by 2) and a vanilla unit ("o-unit": power 5).
    // Melee row is currently empty.
    const state = makeTestState(
      makeTestPlayer("player"),
      makeTestPlayer("opponent", [
        makeTestCard("o-buff", 2),
        makeTestCard("o-unit", 5),
      ]),
      1,
    );
    state.cardDefinitions["o-buff"] = {
      id: "o-buff",
      name: "Melee Buff",
      type: "unit",
      row: "melee",
      power: 2,
      rarity: "elite",
      effects: [{ type: "BUFF", target: { type: "ALLY_ROW", row: "melee" }, amount: 2 }],
    };
    state.cardDefinitions["o-unit"] = {
      id: "o-unit",
      name: "Melee Unit",
      type: "unit",
      row: "melee",
      power: 5,
      rarity: "common",
      effects: [],
    };

    // If AI plays o-buff first, it gets 2 power, and buff does nothing. Total power = 2.
    // If AI plays o-unit first, it gets 5 power, AND because o-buff is in hand, it gets synergy bonus (1 unit * 2 buff * 0.5 = +1). Total power evaluation = 6.
    // So the AI should choose o-unit!
    const action = chooseNormalAIAction(state, "opponent", NORMAL_AI_WEIGHTS);
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-unit");
    }
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

  test("getAIWeightsForDifficulty returns appropriate weight profiles", () => {
    expect(getAIWeightsForDifficulty(1)).toBe(EASY_AI_WEIGHTS);
    expect(getAIWeightsForDifficulty(2)).toBe(EASY_AI_WEIGHTS);
    expect(getAIWeightsForDifficulty(3)).toBe(NORMAL_AI_WEIGHTS);
    expect(getAIWeightsForDifficulty(4)).toBe(HARD_AI_WEIGHTS);
    expect(getAIWeightsForDifficulty(5)).toBe(HARD_AI_WEIGHTS);
  });

  test("chooseNormalAIAction respects custom weights", () => {
    // Set up a state where:
    // opponent is behind, round 1, has 1 cheap unit card (instance "o-h1", power 5).
    // The budget for round 1 is exceeded (opponent has played 4 cards).
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

    // Under Normal weights (overBudgetPenalty: 8), the AI should PASS.
    expect(chooseNormalAIAction(state, "opponent", NORMAL_AI_WEIGHTS).type).toBe("PASS");

    // Under Easy weights (overBudgetPenalty: 3, hopelessChasePenalty: 8, cardResourceCost: 0.15),
    // the penalty is low, so the AI should choose to PLAY_CARD.
    expect(chooseNormalAIAction(state, "opponent", EASY_AI_WEIGHTS).type).toBe("PLAY_CARD");
  });
});

import { describe, expect, test } from "vitest";
import {
  countCardsPlayedThisRound,
  estimateCardResourceCost,
  estimateCatchupPlan,
  evaluateStateForPlayer,
  getRoundBudget,
} from "./aiEvaluation";
import {
  makeTestCard,
  makeTestPlayer,
  makeTestState,
} from "./aiTestHelpers";

describe("AI evaluation helpers", () => {
  test("values hand advantage even when board scores are tied", () => {
    const state = makeTestState(
      makeTestPlayer("player", [makeTestCard("p-hand", 3, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-h1", 3),
        makeTestCard("o-h2", 3),
        makeTestCard("o-h3", 3),
      ]),
    );

    expect(evaluateStateForPlayer(state, "opponent")).toBeGreaterThan(
      evaluateStateForPlayer(state, "player"),
    );
  });

  test("estimates how many cards are needed to catch up", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 10, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-h1", 5),
        makeTestCard("o-h2", 4),
        makeTestCard("o-h3", 3),
      ]),
    );

    const plan = estimateCatchupPlan(state, "opponent");
    expect(plan.pointsNeeded).toBe(11);
    expect(plan.canCatchUp).toBe(true);
    expect(plan.cardsNeeded).toBe(3);
  });

  test("marks catch-up impossible when hand cannot overtake", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 15, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-h1", 4),
        makeTestCard("o-h2", 4),
      ]),
    );

    const plan = estimateCatchupPlan(state, "opponent");
    expect(plan.canCatchUp).toBe(false);
    expect(plan.cardsNeeded).toBe(2);
  });

  test("applies tighter round budget when already up one round", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [], false, 0),
      makeTestPlayer("opponent", [], [], false, 1),
      2,
    );

    const budget = getRoundBudget(state, "opponent");
    expect(budget.maxCardsThisRound).toBe(3);
    expect(budget.isOverBudget).toBe(false);
  });

  test("counts only play-card actions from the current round", () => {
    const state = makeTestState(makeTestPlayer("player"), makeTestPlayer("opponent"));
    state.actionLog = [
      { id: "1", message: "PLAY_CARD", playerId: "opponent", round: 1 },
      { id: "2", message: "PASS", playerId: "opponent", round: 1 },
      { id: "3", message: "PLAY_CARD", playerId: "player", round: 1 },
      { id: "4", message: "PLAY_CARD", playerId: "opponent", round: 2 },
    ];
    state.currentRound = 2;

    expect(countCardsPlayedThisRound(state, "opponent")).toBe(1);
  });

  test("charges higher resource cost for stronger cards", () => {
    const lowCard = makeTestCard("low", 3);
    const highCard = makeTestCard("high", 9);
    const state = makeTestState(
      makeTestPlayer("player"),
      makeTestPlayer("opponent", [lowCard, highCard]),
    );

    expect(estimateCardResourceCost(state, highCard)).toBeGreaterThan(
      estimateCardResourceCost(state, lowCard),
    );
  });

  test("evaluates kill shot bonus correctly based on destroyed units in graveyard", () => {
    const player = makeTestPlayer("player");
    const opponent = makeTestPlayer("opponent");

    const pCard = makeTestCard("p-dead", 3, "player");
    pCard.isDestroyed = true;
    player.graveyard.push(pCard);

    const oCard1 = makeTestCard("o-dead1", 3, "opponent");
    oCard1.isDestroyed = true;
    const oCard2 = makeTestCard("o-dead2", 3, "opponent");
    oCard2.isDestroyed = true;
    opponent.graveyard.push(oCard1, oCard2);

    const state = makeTestState(player, opponent);
    // base score is 0. 1 net destroyed card for opponent * killShotBonus (4) = 4.
    expect(evaluateStateForPlayer(state, "player")).toBe(4);
  });

  test("evaluates row-buff synergy bonus from hand cards", () => {
    const handCard = makeTestCard("buff-card", 2, "player");
    const boardCard = makeTestCard("board-card", 3, "player", "melee");
    const player = makeTestPlayer("player", [handCard], [boardCard]);
    const opponent = makeTestPlayer("opponent");
    const state = makeTestState(player, opponent);
    
    state.cardDefinitions["buff-card"].effects = [
      {
        type: "BUFF",
        target: { type: "ALLY_ROW", row: "melee" },
        amount: 2,
      },
    ];

    // base score:
    // scoreDiff = 3 - 0 = 3
    // handAdvantage = 1 - 0 = 1
    // boardUnitAdvantage = 1 - 0 = 1
    // NORMAL_AI_WEIGHTS: scoreDiff (1), handAdvantage (5), boardUnitAdvantage (1)
    // base score = 3 * 1 + 1 * 5 + 1 * 1 = 9
    //
    // Synergy bonus:
    // rowCount on melee = 1 active unit ("board-card")
    // buff amount = 2
    // synergyBonusScale = 0.5
    // bonus = 1 * 2 * 0.5 = 1
    //
    // Total score: 9 + 1 = 10
    expect(evaluateStateForPlayer(state, "player")).toBe(10);
  });
});

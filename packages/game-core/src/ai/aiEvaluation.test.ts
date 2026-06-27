import { describe, expect, test } from "vitest";
import {
  countCardsPlayedThisRound,
  estimateCardResourceCost,
  estimateCatchupPlan,
  evaluateStateForPlayer,
  getRoundBudget,
  isSurvivalRound,
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

  describe("isSurvivalRound", () => {
    test("is true when player has 0 wins and opponent has 1 win", () => {
      const state = makeTestState(
        makeTestPlayer("player", [], [], false, 0),
        makeTestPlayer("opponent", [], [], false, 1),
      );
      expect(isSurvivalRound(state, "player")).toBe(true);
      expect(isSurvivalRound(state, "opponent")).toBe(false);
    });

    test("is false when wins are tied or player is ahead", () => {
      const state1 = makeTestState(
        makeTestPlayer("player", [], [], false, 0),
        makeTestPlayer("opponent", [], [], false, 0),
      );
      expect(isSurvivalRound(state1, "player")).toBe(false);

      const state2 = makeTestState(
        makeTestPlayer("player", [], [], false, 1),
        makeTestPlayer("opponent", [], [], false, 0),
      );
      expect(isSurvivalRound(state2, "player")).toBe(false);

      const state3 = makeTestState(
        makeTestPlayer("player", [], [], false, 1),
        makeTestPlayer("opponent", [], [], false, 1),
      );
      expect(isSurvivalRound(state3, "player")).toBe(false);
    });
  });

  describe("hand quality premium", () => {
    test("applies premium to hand cards in early rounds when not in survival", () => {
      const pCard = makeTestCard("p-hero", 3, "player");
      const oCard = makeTestCard("o-legend", 3, "opponent");
      
      const player = makeTestPlayer("player", [pCard]);
      const opponent = makeTestPlayer("opponent", [oCard]);
      const state = makeTestState(player, opponent, 1); // Round 1

      // Set rarity definitions
      state.cardDefinitions["p-hero"].rarity = "hero";
      state.cardDefinitions["o-legend"].rarity = "legend";

      // NORMAL_AI_WEIGHTS.handAdvantage is 5
      // Base score evaluation for 'player':
      // scoreDiff = 0
      // roundWinsDiff = 0
      // handAdvantage = 1 (p) - 1 (o) = 0
      // deckAdvantage = 0
      // boardUnitAdvantage = 0
      // Base score = 0
      //
      // Hand premium:
      // Player: hero card -> premium = 3.0. Score += 3.0 * (weights.handAdvantage * 0.4) = 3.0 * (5 * 0.4) = 3.0 * 2.0 = 6.0
      // Opponent: legend card -> premium = 6.0. Score -= 6.0 * (weights.handAdvantage * 0.4) = 6.0 * (5 * 0.4) = 6.0 * 2.0 = 12.0
      // Total expected score for 'player' = 0 + 6 - 12 = -6.0
      expect(evaluateStateForPlayer(state, "player")).toBe(-6.0);
    });

    test("does not apply hand quality premium in round 3 or later", () => {
      const pCard = makeTestCard("p-hero", 3, "player");
      const player = makeTestPlayer("player", [pCard]);
      const opponent = makeTestPlayer("opponent");
      const state = makeTestState(player, opponent, 3); // Round 3

      state.cardDefinitions["p-hero"].rarity = "hero";

      // Base score evaluation for 'player':
      // handAdvantage = 1 - 0 = 1. weights.handAdvantage = 5.
      // Expected score = 5 (no premium applied)
      expect(evaluateStateForPlayer(state, "player")).toBe(5);
    });

    test("does not apply hand quality premium during survival rounds", () => {
      const pCard = makeTestCard("p-hero", 3, "player");
      const player = makeTestPlayer("player", [pCard], [], false, 0);
      const opponent = makeTestPlayer("opponent", [], [], false, 1);
      const state = makeTestState(player, opponent, 2); // Round 2 (Survival Round)

      state.cardDefinitions["p-hero"].rarity = "hero";

      // Base score evaluation for 'player':
      // roundWinsDiff = 0 - 1 = -1. weights.roundWinsDiff = 25. -> -25
      // handAdvantage = 1 - 0 = 1. weights.handAdvantage = 5. -> 5
      // Expected score = -20 (no premium applied)
      expect(evaluateStateForPlayer(state, "player")).toBe(-20);
    });
  });

  describe("survival round budget", () => {
    test("allows spending all cards in hand during a survival round", () => {
      const player = makeTestPlayer("player", [makeTestCard("p1", 3), makeTestCard("p2", 3)], [], false, 0);
      const opponent = makeTestPlayer("opponent", [], [], false, 1);
      const state = makeTestState(player, opponent, 2);
      
      state.actionLog = [
        { id: "1", message: "PLAY_CARD", playerId: "player", round: 2 },
      ];

      const budget = getRoundBudget(state, "player");
      // cardsPlayedThisRound = 1
      // hand.length = 2
      // maxCardsThisRound = 1 + 2 = 3
      expect(budget.maxCardsThisRound).toBe(3);
      expect(budget.isOverBudget).toBe(false);
    });
  });
});

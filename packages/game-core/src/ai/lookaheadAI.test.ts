import { describe, expect, it } from "vitest";
import { chooseLookahead3PlyAIAction } from "./lookaheadAI";
import { getLegalActions } from "../rules/legalActions";
import { makeTestCard, makeTestPlayer, makeTestState } from "./aiTestHelpers";
import { chooseSimpleAIAction } from "./simpleAI";
import { applyAction } from "../rules/reducer";
import { INITIAL_CARDS } from "../cards/cardData";
import { createInitialGameState } from "../rules/gameInit";
import type { GameState, PlayerId } from "../types";

describe("chooseLookahead3PlyAIAction", () => {
  it("always returns a legal action for the active player", () => {
    const state = makeTestState(
      makeTestPlayer("player", [makeTestCard("p-h1", 5, "player")]),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 5, "opponent")]),
      1,
      "player",
    );

    const action = chooseLookahead3PlyAIAction(state, "player");
    const legal = getLegalActions(state, "player");

    expect(legal).toContainEqual(action);
  });

  it("returns PASS when there are no legal play actions", () => {
    const state = makeTestState(
      makeTestPlayer("player", []),
      makeTestPlayer("opponent", []),
      1,
      "player",
    );

    const action = chooseLookahead3PlyAIAction(state, "player");
    expect(action.type).toBe("PASS");
  });

  it("chooses the higher value move when playing a card", () => {
    const lowCard = makeTestCard("low-card", 2, "player");
    const highCard = makeTestCard("high-card", 8, "player");

    const state = makeTestState(
      makeTestPlayer("player", [lowCard, highCard]),
      makeTestPlayer("opponent", []),
      1,
      "player",
    );

    const action = chooseLookahead3PlyAIAction(state, "player");
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("high-card");
    }
  });

  it("avoids PASSing in survival round when losing or tied and having cards in hand", () => {
    // Survival round: round wins are 1 vs 1, currentRound is 3.
    // Or opponent has 1 round win and is about to win the match.
    // Let's configure roundWins: opponent has 1 round win, player has 0 round wins.
    // Opponent can win the game if they win this round. This is a survival round for the player.
    const player = makeTestPlayer("player", [makeTestCard("p-h1", 5, "player")], [], false, 0);
    const opponent = makeTestPlayer("opponent", [], [makeTestCard("o-b1", 2, "opponent")], false, 1);
    const state = makeTestState(player, opponent, 2, "player");

    const action = chooseLookahead3PlyAIAction(state, "player");
    // Should NOT pass because it's a survival round, player is losing (score 0 vs 2), and has cards in hand.
    expect(action.type).toBe("PLAY_CARD");
  });

  it("can complete a full match against simple AI without crashing", () => {
    const qinCards = INITIAL_CARDS.filter((c) => c.faction === "qin").slice(0, 10);
    const chuCards = INITIAL_CARDS.filter((c) => c.faction === "chu").slice(0, 10);

    let state = createInitialGameState({
      seed: "lookahead-3ply-full-game",
      playerFaction: "qin",
      opponentFaction: "chu",
      playerDeck: qinCards,
      opponentDeck: chuCards,
      firstPlayerId: "player",
    });

    const MAX_TURNS = 100;
    let turns = 0;

    while (state.status !== "game_finished" && turns < MAX_TURNS) {
      if (state.status === "round_finished") {
        state = applyAction(state, { type: "START_NEXT_ROUND" });
      } else {
        const playerId = state.currentPlayerId;
        const action =
          playerId === "opponent"
            ? chooseLookahead3PlyAIAction(state, playerId)
            : chooseSimpleAIAction(state, playerId);
        state = applyAction(state, action);
      }
      turns++;
    }

    expect(state.status).toBe("game_finished");
    expect(state.winnerId).toBeDefined();
    expect(turns).toBeLessThan(MAX_TURNS);
  });
});

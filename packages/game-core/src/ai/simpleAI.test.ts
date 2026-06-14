import { describe, expect, it } from "vitest";
import { chooseSimpleAIAction } from "./simpleAI";
import { createInitialGameState } from "../rules/gameInit";
import { getLegalActions } from "../rules/legalActions";
import { applyAction } from "../rules/reducer";
import { INITIAL_CARDS } from "../cards/cardData";
import type { GameState, PlayerId } from "../types";

// Build a standard deck for tests: 10 Qin cards from the full pool.
const QIN_DECK = INITIAL_CARDS.filter((c) => c.faction === "qin").slice(0, 10);
const CHU_DECK = INITIAL_CARDS.filter((c) => c.faction === "chu").slice(0, 10);

function createTestGame(seed = "test-seed"): GameState {
  return createInitialGameState({
    seed,
    playerFaction: "qin",
    opponentFaction: "chu",
    playerDeck: QIN_DECK,
    opponentDeck: CHU_DECK,
    firstPlayerId: "player",
  });
}

describe("chooseSimpleAIAction", () => {
  it("always returns a legal action for the active player", () => {
    const state = createTestGame();
    const action = chooseSimpleAIAction(state, "player");
    const legal = getLegalActions(state, "player");

    // The returned action must appear in the legal list.
    expect(legal.some((a) => JSON.stringify(a) === JSON.stringify(action))).toBe(
      true,
    );
  });

  it("returns a PASS when there are no play actions", () => {
    // Create a state where the active player has an empty hand.
    const base = createTestGame();
    const emptyHandState: GameState = {
      ...base,
      players: {
        ...base.players,
        player: {
          ...base.players.player,
          hand: [],
        },
      },
    };

    const action = chooseSimpleAIAction(emptyHandState, "player");
    expect(action.type).toBe("PASS");
  });

  it("returns PASS as a safe fallback when getLegalActions is empty", () => {
    // Simulate a state where the player has already passed (no legal actions).
    const base = createTestGame();
    const passedState: GameState = {
      ...base,
      players: {
        ...base.players,
        player: {
          ...base.players.player,
          hasPassed: true,
        },
      },
    };

    const action = chooseSimpleAIAction(passedState, "player");
    expect(action.type).toBe("PASS");
  });

  it("returns a PLAY_CARD action when the hand is non-empty", () => {
    const state = createTestGame();
    // Player starts with cards in hand, so should prefer playing.
    const action = chooseSimpleAIAction(state, "player");
    expect(action.type).toBe("PLAY_CARD");
  });

  it("is deterministic: same seed produces same choice", () => {
    const stateA = createTestGame("seed-42");
    const stateB = createTestGame("seed-42");
    const actionA = chooseSimpleAIAction(stateA, "player");
    const actionB = chooseSimpleAIAction(stateB, "player");
    expect(actionA).toEqual(actionB);
  });

  it("does not mutate the input state", () => {
    const state = createTestGame();
    const handBefore = [...state.players.player.hand];
    chooseSimpleAIAction(state, "player");
    expect(state.players.player.hand).toEqual(handBefore);
  });

  it("can complete a full match without infinite loops", () => {
    // Use exactly 10 cards per faction (= STARTING_HAND_SIZE) so hand is
    // exhausted in round 1. Rounds 2-3 have empty hands so both players
    // pass immediately. The draw tiebreaker in round 3 guarantees the game
    // always reaches game_finished.
    const QIN_10 = INITIAL_CARDS.filter((c) => c.faction === "qin").slice(0, 10);
    const CHU_10 = INITIAL_CARDS.filter((c) => c.faction === "chu").slice(0, 10);

    let state = createInitialGameState({
      seed: "full-game-seed",
      playerFaction: "qin",
      opponentFaction: "chu",
      playerDeck: QIN_10,
      opponentDeck: CHU_10,
      firstPlayerId: "player",
    });

    const MAX_STEPS = 300;
    let steps = 0;

    while (state.status !== "game_finished" && steps < MAX_STEPS) {
      steps += 1;

      if (state.status === "round_finished") {
        state = applyAction(state, { type: "START_NEXT_ROUND" });
        continue;
      }

      const current = state.currentPlayerId as PlayerId;
      const action = chooseSimpleAIAction(state, current);
      state = applyAction(state, action);
    }

    expect(state.status).toBe("game_finished");
    expect(state.winnerId).toBeTruthy();
    expect(steps).toBeLessThan(MAX_STEPS);
  });
});

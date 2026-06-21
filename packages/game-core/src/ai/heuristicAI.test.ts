import { describe, expect, it } from "vitest";
import { chooseHeuristicAIAction } from "./heuristicAI";
import { chooseSimpleAIAction } from "./simpleAI";
import { applyAction } from "../rules/reducer";
import { createInitialGameState } from "../rules/gameInit";
import { INITIAL_CARDS } from "../cards/cardData";
import type { CardInstance, GameState, PlayerId, PlayerState, Row } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCard(
  instanceId: string,
  power: number,
  ownerId: PlayerId = "opponent",
  row: Row = "melee",
): CardInstance {
  return {
    instanceId,
    cardId: instanceId,
    ownerId,
    type: "unit",
    row,
    currentPower: power,
    basePower: power,
    isLocked: false,
    isDestroyed: false,
    modifiers: [],
  };
}

function makePlayer(
  id: PlayerId,
  hand: CardInstance[] = [],
  boardMelee: CardInstance[] = [],
  hasPassed = false,
  roundWins = 0,
): PlayerState {
  return {
    id,
    faction: id === "player" ? "qin" : "chu",
    deck: [],
    hand,
    board: { melee: boardMelee, ranged: [], siege: [] },
    graveyard: [],
    hasPassed,
    roundWins,
  };
}

function makeState(player: PlayerState, opponent: PlayerState, round = 1): GameState {
  return {
    id: "test",
    seed: "test-seed",
    status: "playing",
    currentRound: round,
    currentPlayerId: "opponent",
    players: { player, opponent },
    actionLog: [],
    cardDefinitions: {},
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("chooseHeuristicAIAction", () => {
  it("always returns a legal action", () => {
    const hand = [makeCard("opp-card-1", 5)];
    const state = makeState(
      makePlayer("player", [], [makeCard("p-card", 3, "player")]),
      makePlayer("opponent", hand),
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(["PLAY_CARD", "PASS"]).toContain(action.type);
  });

  it("returns PASS when hand is empty", () => {
    const state = makeState(
      makePlayer("player"),
      makePlayer("opponent", []), // empty hand
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(action.type).toBe("PASS");
  });

  it("passes when opponent (player) has passed and AI is winning", () => {
    // AI (opponent) is ahead 10 vs 3, and player has passed.
    const state = makeState(
      makePlayer("player", [makeCard("p-card", 3, "player")], [], true), // hasPassed
      makePlayer("opponent", [makeCard("o-hand", 6)], [makeCard("o-board", 10)]),
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(action.type).toBe("PASS");
  });

  it("plays a card when opponent has passed and AI is losing", () => {
    // AI (opponent) is behind 5 vs 10, player has passed.
    const state = makeState(
      makePlayer("player", [], [makeCard("p-board", 10, "player")], true), // hasPassed, winning
      makePlayer("opponent", [makeCard("o-hand", 5)], [makeCard("o-board", 5)]),
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(action.type).toBe("PLAY_CARD");
  });

  it("passes when comfortably ahead (≥5 lead, ≥4 hand cards, ≥3 board units)", () => {
    const boardCards = [
      makeCard("o-b1", 4), makeCard("o-b2", 4), makeCard("o-b3", 4),
    ]; // 12 total board power for opponent
    const playerBoard = [makeCard("p-b1", 3, "player"), makeCard("p-b2", 4, "player")]; // 7 total
    // lead = 12 - 7 = 5, hand has 5 cards, 3 board units

    const handCards = [
      makeCard("o-h1", 3), makeCard("o-h2", 3), makeCard("o-h3", 3),
      makeCard("o-h4", 3), makeCard("o-h5", 3),
    ];

    const state = makeState(
      makePlayer("player", [], playerBoard),
      makePlayer("opponent", handCards, boardCards),
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(action.type).toBe("PASS");
  });

  it("does not pass before placing any units on the board", () => {
    // AI is technically ahead because player has no board either, but should
    // play first before considering passing.
    const state = makeState(
      makePlayer("player", [], []), // no board
      makePlayer("opponent", [makeCard("o-hand", 6)], []), // no board units
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(action.type).toBe("PLAY_CARD");
  });

  it("always passes when lead is ≥10, regardless of hand/board size", () => {
    const state = makeState(
      makePlayer("player", [], [makeCard("p-board", 1, "player")]), // score 1
      makePlayer("opponent", [makeCard("o-hand", 3)], [makeCard("o-board", 11)]), // score 11
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(action.type).toBe("PASS");
  });

  it("picks the highest estimated-value play when it must play a card", () => {
    const lowCard = makeCard("low", 2);
    const highCard = makeCard("high", 9);

    const state = makeState(
      makePlayer("player"),
      makePlayer("opponent", [lowCard, highCard], []),
    );

    const action = chooseHeuristicAIAction(state, "opponent");
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("high");
    }
  });

  it("can complete a full match without infinite loops", () => {
    const playerCards = INITIAL_CARDS.filter((c) => c.faction === "qin");
    const opponentCards = INITIAL_CARDS.filter((c) => c.faction === "chu");

    let state = createInitialGameState({
      seed: "heuristic-full-game",
      playerFaction: "qin",
      opponentFaction: "chu",
      playerDeck: [...playerCards, ...playerCards],
      opponentDeck: [...opponentCards, ...opponentCards],
      firstPlayerId: "player",
    });

    const MAX_TURNS = 300;
    let turns = 0;

    while (state.status !== "game_finished" && turns < MAX_TURNS) {
      if (state.status === "round_finished") {
        state = applyAction(state, { type: "START_NEXT_ROUND" });
      } else {
        const playerId = state.currentPlayerId;
        // Use heuristic AI for opponent, simple AI for player.
        const action =
          playerId === "opponent"
            ? chooseHeuristicAIAction(state, playerId)
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

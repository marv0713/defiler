import { describe, expect, test } from "vitest";
import { simulateGame } from "./simulateGame";

describe("simulateGame", () => {
  test("completes one AI vs AI game and returns summary stats", () => {
    const result = simulateGame({
      seed: "simulation-completes",
      playerFaction: "qin",
      opponentFaction: "chu",
    });

    expect(result.finalState.status).toBe("game_finished");
    expect(result.stoppedReason).toBe("game_finished");
    expect(result.winner).toBeDefined();
    expect(result.rounds).toBeGreaterThanOrEqual(2);
    expect(result.turns).toBeGreaterThan(0);
    expect(result.finalScores.player).toBeGreaterThanOrEqual(0);
    expect(result.finalScores.opponent).toBeGreaterThanOrEqual(0);
    expect(result.actionSummary.total).toBe(result.finalState.actionLog.length);
    expect(result.actionSummary.byType.PLAY_CARD).toBeGreaterThan(0);
  });

  test("stops safely when maxTurns is reached", () => {
    const result = simulateGame({
      seed: "simulation-max-turns",
      playerFaction: "qi",
      opponentFaction: "zhao",
      maxTurns: 1,
    });

    expect(result.stoppedReason).toBe("max_turns");
    expect(result.turns).toBe(1);
    expect(result.finalState.status).toBe("playing");
  });

  test("can run with a custom AI chooser", () => {
    const result = simulateGame({
      seed: "simulation-custom-ai",
      playerFaction: "qin",
      opponentFaction: "chu",
      chooseAction: (_state, playerId) => ({ type: "PASS", playerId }),
    });

    expect(result.stoppedReason).toBe("game_finished");
    expect(result.actionSummary.byType.PASS).toBeGreaterThan(0);
  });
});

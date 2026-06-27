import { describe, expect, test } from "vitest";
import { compareAIStrategies } from "./aiComparison";

describe("AI Benchmark - strategy comparisons", () => {
  test("lookahead-3ply achieves high win rate against utility-v1 in mirrors", () => {
    const report = compareAIStrategies({
      seed: "bench-seed-lookahead-3ply",
      games: 50,
      aiA: "lookahead-3ply",
      aiB: "utility-v1",
      factionA: "qin",
      factionB: "qin",
    });

    const winRate = (report.aiA.wins / report.games) * 100;
    console.log(`[AI Bench 3-Ply] Wins: ${report.aiA.wins}, Losses: ${report.aiB.wins}, Draws: ${report.draws}. Win Rate: ${winRate.toFixed(1)}%`);

    expect(report.games).toBe(50);
    expect(report.completedGames).toBe(50);
    expect(report.stoppedByMaxTurns).toBe(0);
    expect(winRate).toBeGreaterThanOrEqual(65);
  });
});

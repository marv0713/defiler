import { describe, expect, test } from "vitest";
import { simulateMatchup } from "./simulateMatchup";

describe("simulateMatchup", () => {
  test("runs multiple games and returns aggregate matchup stats", () => {
    const report = simulateMatchup({
      seed: "matchup-basic",
      games: 10,
      factionA: "qin",
      factionB: "chu",
    });

    expect(report.games).toBe(10);
    expect(report.completedGames).toBe(10);
    expect(report.factionA).toBe("qin");
    expect(report.factionB).toBe("chu");
    expect(report.factionAWins + report.factionBWins + report.draws).toBe(10);
    expect(report.averageRounds).toBeGreaterThan(0);
    expect(report.averageTurns).toBeGreaterThan(0);
    expect(report.averageFinalScores.factionA).toBeGreaterThanOrEqual(0);
    expect(report.averageFinalScores.factionB).toBeGreaterThanOrEqual(0);
  });

  test("reports card draw and play stats", () => {
    const report = simulateMatchup({
      seed: "matchup-card-stats",
      games: 6,
      factionA: "qin",
      factionB: "chu",
    });

    const playedCards = Object.values(report.cardStats).filter(
      (stats) => stats.timesPlayed > 0,
    );

    expect(playedCards.length).toBeGreaterThan(0);
    expect(playedCards[0].cardId).toBeTruthy();
    expect(playedCards[0].timesDrawn).toBeGreaterThanOrEqual(
      playedCards[0].timesPlayed,
    );
    expect(playedCards[0].winRateWhenPlayed).toBeGreaterThanOrEqual(0);
    expect(playedCards[0].winRateWhenPlayed).toBeLessThanOrEqual(1);
    expect(playedCards[0].averageContribution).toBeGreaterThanOrEqual(0);
  });

  test("can run 1000 games without crashing", () => {
    const report = simulateMatchup({
      seed: "matchup-1000-smoke",
      games: 1000,
      factionA: "qi",
      factionB: "zhao",
    });

    expect(report.games).toBe(1000);
    expect(report.completedGames).toBe(1000);
    expect(report.stoppedByMaxTurns).toBe(0);
  });
});

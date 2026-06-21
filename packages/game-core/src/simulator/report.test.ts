import { describe, expect, test } from "vitest";
import { formatSimulationReport } from "./report";
import { simulateMatchup } from "./simulateMatchup";

describe("formatSimulationReport", () => {
  test("formats a readable matchup report", () => {
    const report = simulateMatchup({
      seed: "formatted-report",
      games: 5,
      factionA: "qin",
      factionB: "chu",
    });

    const text = formatSimulationReport(report);

    expect(text).toContain("Qin vs Chu");
    expect(text).toContain("Games: 5");
    expect(text).toContain("Qin win rate:");
    expect(text).toContain("Chu win rate:");
    expect(text).toContain("Average turns:");
    expect(text).toContain("Top played cards:");
  });
});

import { describe, expect, test } from "vitest";
import { compareAIStrategies } from "./aiComparison";

describe("compareAIStrategies", () => {
  test("returns deterministic aggregate metrics", () => {
    const first = compareAIStrategies({
      seed: "ai-compare-test",
      games: 6,
      aiA: "utility-v1",
      aiB: "round-strategy",
      factionA: "qin",
      factionB: "chu",
    });

    const second = compareAIStrategies({
      seed: "ai-compare-test",
      games: 6,
      aiA: "utility-v1",
      aiB: "round-strategy",
      factionA: "qin",
      factionB: "chu",
    });

    expect(second).toEqual(first);
    expect(first.games).toBe(6);
    expect(first.aiA.id).toBe("utility-v1");
    expect(first.aiB.id).toBe("round-strategy");
    expect(first.completedGames + first.stoppedByMaxTurns).toBe(6);
  });
});

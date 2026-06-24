import { describe, expect, test } from "vitest";
import { simulateGame } from "../simulator/simulateGame";
import { chooseNormalAIAction } from "./normalAI";
import { HARD_AI_WEIGHTS, NORMAL_AI_WEIGHTS } from "./aiEvaluation";
import type { GameState, PlayerId } from "../types";

describe("AI Benchmark - Hard AI vs Normal AI", () => {
  test("Hard AI achieves >= 60% win rate against Normal AI in 100 mirrors", () => {
    let hardWins = 0;
    let normalWins = 0;
    let draws = 0;
    const runs = 100;

    for (let i = 0; i < runs; i++) {
      const seed = `bench-seed-${i}`;
      const result = simulateGame({
        seed,
        playerFaction: "qin",
        opponentFaction: "qin",
        firstPlayerId: i % 2 === 0 ? "player" : "opponent", // Alternate first player
        chooseAction: (state: GameState, playerId: PlayerId) => {
          if (playerId === "player") {
            // Player uses Hard AI (tuned weights + full synergy heuristics)
            return chooseNormalAIAction(state, playerId, HARD_AI_WEIGHTS);
          } else {
            // Opponent uses Normal AI (standard weights + lower synergy)
            return chooseNormalAIAction(state, playerId, NORMAL_AI_WEIGHTS);
          }
        },
      });

      if (result.winner === "player") {
        hardWins++;
      } else if (result.winner === "opponent") {
        normalWins++;
      } else {
        draws++;
      }
    }

    const winRate = (hardWins / runs) * 100;
    console.log(`[AI Bench] Hard AI Wins: ${hardWins}, Normal AI Wins: ${normalWins}, Draws: ${draws}. Win Rate: ${winRate.toFixed(1)}%`);

    // Assert that Hard AI performs significantly better than Normal AI (>= 60% win rate).
    expect(winRate).toBeGreaterThanOrEqual(60);
  });
});

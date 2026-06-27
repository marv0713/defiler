import { simulateGame } from "../simulator/simulateGame";
import type { Faction, PlayerId } from "../types";
import type { UtilityAIWeights } from "./aiEvaluation";
import { chooseAIAction, type AIId } from "./aiStrategy";

export interface AIComparisonConfig {
  seed: string;
  games: number;
  aiA: AIId;
  aiB: AIId;
  factionA: Faction;
  factionB: Faction;
  weightsA?: UtilityAIWeights;
  weightsB?: UtilityAIWeights;
  maxTurns?: number;
}

export interface AIComparisonSide {
  id: AIId;
  wins: number;
  winRate: number;
}

export interface AIComparisonReport {
  games: number;
  completedGames: number;
  stoppedByMaxTurns: number;
  aiA: AIComparisonSide;
  aiB: AIComparisonSide;
  draws: number;
  averageTurns: number;
  averageRounds: number;
}

function rate(count: number, games: number): number {
  return games === 0 ? 0 : count / games;
}

export function compareAIStrategies(
  config: AIComparisonConfig,
): AIComparisonReport {
  let completedGames = 0;
  let stoppedByMaxTurns = 0;
  let aiAWins = 0;
  let aiBWins = 0;
  let draws = 0;
  let totalTurns = 0;
  let totalRounds = 0;

  for (let index = 0; index < config.games; index += 1) {
    const result = simulateGame({
      seed: `${config.seed}-${index}`,
      playerFaction: config.factionA,
      opponentFaction: config.factionB,
      maxTurns: config.maxTurns,
      chooseAction: (state, playerId: PlayerId) =>
        chooseAIAction({
          aiId: playerId === "player" ? config.aiA : config.aiB,
          state,
          playerId,
          weights: playerId === "player" ? config.weightsA : config.weightsB,
        }),
    });

    if (result.stoppedReason === "game_finished") {
      completedGames += 1;
    } else {
      stoppedByMaxTurns += 1;
    }

    if (result.winner === "player") {
      aiAWins += 1;
    } else if (result.winner === "opponent") {
      aiBWins += 1;
    } else {
      draws += 1;
    }

    totalTurns += result.turns;
    totalRounds += result.rounds;
  }

  return {
    games: config.games,
    completedGames,
    stoppedByMaxTurns,
    aiA: { id: config.aiA, wins: aiAWins, winRate: rate(aiAWins, config.games) },
    aiB: { id: config.aiB, wins: aiBWins, winRate: rate(aiBWins, config.games) },
    draws,
    averageTurns: config.games === 0 ? 0 : totalTurns / config.games,
    averageRounds: config.games === 0 ? 0 : totalRounds / config.games,
  };
}

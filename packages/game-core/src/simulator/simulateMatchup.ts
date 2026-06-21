import { chooseNormalAIAction } from "../ai/normalAI";
import type { GameAction } from "../rules/actions";
import type {
  CardDefinition,
  CardInstance,
  Faction,
  GameState,
  PlayerId,
} from "../types";
import { simulateGame } from "./simulateGame";

export interface SimulationConfig {
  seed: string;
  games: number;
  factionA: Faction;
  factionB: Faction;
  maxTurns?: number;
  chooseAction?: (state: GameState, playerId: PlayerId) => GameAction;
}

export interface CardSimulationStats {
  cardId: string;
  englishName: string;
  faction: Faction;
  timesDrawn: number;
  timesPlayed: number;
  winsWhenPlayed: number;
  winRateWhenPlayed: number;
  averageContribution: number;
}

export interface SimulationReport {
  games: number;
  completedGames: number;
  stoppedByMaxTurns: number;
  factionA: Faction;
  factionB: Faction;
  factionAWins: number;
  factionBWins: number;
  draws: number;
  factionAWinRate: number;
  factionBWinRate: number;
  drawRate: number;
  averageRounds: number;
  averageTurns: number;
  averageFinalScores: {
    factionA: number;
    factionB: number;
  };
  cardStats: Record<string, CardSimulationStats>;
}

interface MutableCardStats extends CardSimulationStats {
  totalContribution: number;
}

interface PlayedCardRecord {
  cardId: string;
  playerId: PlayerId;
}

function getCardStats(
  stats: Record<string, MutableCardStats>,
  card: CardInstance,
  definition: CardDefinition | undefined,
): MutableCardStats {
  const existing = stats[card.cardId];
  if (existing) return existing;

  const created: MutableCardStats = {
    cardId: card.cardId,
    englishName: definition?.englishName ?? card.cardId,
    faction: definition?.faction ?? "neutral",
    timesDrawn: 0,
    timesPlayed: 0,
    winsWhenPlayed: 0,
    winRateWhenPlayed: 0,
    averageContribution: 0,
    totalContribution: 0,
  };
  stats[card.cardId] = created;
  return created;
}

function observeVisibleCards(
  state: GameState,
  seenDrawnInstanceIds: Set<string>,
  stats: Record<string, MutableCardStats>,
): void {
  for (const player of Object.values(state.players)) {
    const visibleCards = [
      ...player.hand,
      ...player.graveyard,
      ...player.board.melee,
      ...player.board.ranged,
      ...player.board.siege,
    ];

    for (const card of visibleCards) {
      if (seenDrawnInstanceIds.has(card.instanceId)) continue;
      seenDrawnInstanceIds.add(card.instanceId);

      getCardStats(stats, card, state.cardDefinitions[card.cardId]).timesDrawn += 1;
    }
  }
}

function finalizeCardStats(
  stats: Record<string, MutableCardStats>,
): Record<string, CardSimulationStats> {
  const finalized: Record<string, CardSimulationStats> = {};

  for (const [cardId, stat] of Object.entries(stats)) {
    finalized[cardId] = {
      cardId: stat.cardId,
      englishName: stat.englishName,
      faction: stat.faction,
      timesDrawn: stat.timesDrawn,
      timesPlayed: stat.timesPlayed,
      winsWhenPlayed: stat.winsWhenPlayed,
      winRateWhenPlayed:
        stat.timesPlayed === 0 ? 0 : stat.winsWhenPlayed / stat.timesPlayed,
      averageContribution:
        stat.timesPlayed === 0 ? 0 : stat.totalContribution / stat.timesPlayed,
    };
  }

  return finalized;
}

function rate(count: number, games: number): number {
  return games === 0 ? 0 : count / games;
}

export function simulateMatchup(config: SimulationConfig): SimulationReport {
  const chooseAction = config.chooseAction ?? chooseNormalAIAction;
  const maxTurns = config.maxTurns;
  const cardStats: Record<string, MutableCardStats> = {};

  let completedGames = 0;
  let stoppedByMaxTurns = 0;
  let factionAWins = 0;
  let factionBWins = 0;
  let draws = 0;
  let totalRounds = 0;
  let totalTurns = 0;
  let totalFactionAScore = 0;
  let totalFactionBScore = 0;

  for (let gameIndex = 0; gameIndex < config.games; gameIndex += 1) {
    const seenDrawnInstanceIds = new Set<string>();
    const playedCards: PlayedCardRecord[] = [];

    const result = simulateGame({
      seed: `${config.seed}-${gameIndex}`,
      playerFaction: config.factionA,
      opponentFaction: config.factionB,
      maxTurns,
      chooseAction: (state, playerId) => {
        observeVisibleCards(state, seenDrawnInstanceIds, cardStats);

        const action = chooseAction(state, playerId);
        if (action.type === "PLAY_CARD") {
          const card = state.players[playerId].hand.find(
            (handCard) => handCard.instanceId === action.cardInstanceId,
          );

          if (card) {
            const stat = getCardStats(
              cardStats,
              card,
              state.cardDefinitions[card.cardId],
            );
            stat.timesPlayed += 1;
            stat.totalContribution += card.currentPower;
            playedCards.push({ cardId: card.cardId, playerId });
          }
        }

        return action;
      },
    });

    observeVisibleCards(result.finalState, seenDrawnInstanceIds, cardStats);

    if (result.stoppedReason === "game_finished") {
      completedGames += 1;
    } else {
      stoppedByMaxTurns += 1;
    }

    if (result.winner === "player") {
      factionAWins += 1;
    } else if (result.winner === "opponent") {
      factionBWins += 1;
    } else {
      draws += 1;
    }

    for (const played of playedCards) {
      if (played.playerId === result.winner) {
        cardStats[played.cardId].winsWhenPlayed += 1;
      }
    }

    totalRounds += result.rounds;
    totalTurns += result.turns;
    totalFactionAScore += result.finalScores.player;
    totalFactionBScore += result.finalScores.opponent;
  }

  return {
    games: config.games,
    completedGames,
    stoppedByMaxTurns,
    factionA: config.factionA,
    factionB: config.factionB,
    factionAWins,
    factionBWins,
    draws,
    factionAWinRate: rate(factionAWins, config.games),
    factionBWinRate: rate(factionBWins, config.games),
    drawRate: rate(draws, config.games),
    averageRounds: rate(totalRounds, config.games),
    averageTurns: rate(totalTurns, config.games),
    averageFinalScores: {
      factionA: rate(totalFactionAScore, config.games),
      factionB: rate(totalFactionBScore, config.games),
    },
    cardStats: finalizeCardStats(cardStats),
  };
}

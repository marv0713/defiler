import { calculateScores } from "../rules/scoring";
import type {
  CardDefinition,
  CardInstance,
  GameState,
  PlayerId,
} from "../types";

export interface UtilityAIWeights {
  scoreDiff: number;
  roundWinsDiff: number;
  handAdvantage: number;
  deckAdvantage: number;
  boardUnitAdvantage: number;
  cardResourceCost: number;
  overBudgetPenalty: number;
  hopelessChasePenalty: number;
  opponentPassedLeadBonus: number;
  finalRoundUrgency: number;
  synergyBonusScale: number;
  killShotBonus: number;
}

export interface CatchupPlan {
  pointsNeeded: number;
  cardsNeeded: number;
  totalEstimatedCost: number;
  canCatchUp: boolean;
}

export interface RoundBudget {
  maxCardsThisRound: number;
  cardsPlayedThisRound: number;
  isOverBudget: boolean;
}

export const NORMAL_AI_WEIGHTS: UtilityAIWeights = {
  scoreDiff: 1,
  roundWinsDiff: 25,
  handAdvantage: 5,
  deckAdvantage: 1,
  boardUnitAdvantage: 1,
  cardResourceCost: 0.35,
  overBudgetPenalty: 8,
  hopelessChasePenalty: 18,
  opponentPassedLeadBonus: 30,
  finalRoundUrgency: 12,
  synergyBonusScale: 0.5,
  killShotBonus: 4,
};

export const EASY_AI_WEIGHTS: UtilityAIWeights = {
  scoreDiff: 1,
  roundWinsDiff: 20,
  handAdvantage: 2,
  deckAdvantage: 0.5,
  boardUnitAdvantage: 0.5,
  cardResourceCost: 0.15,
  overBudgetPenalty: 3,
  hopelessChasePenalty: 8,
  opponentPassedLeadBonus: 15,
  finalRoundUrgency: 6,
  synergyBonusScale: 0.0,
  killShotBonus: 0,
};

export const HARD_AI_WEIGHTS: UtilityAIWeights = {
  scoreDiff: 1.2,
  roundWinsDiff: 30,
  handAdvantage: 8.0,
  deckAdvantage: 1.2,
  boardUnitAdvantage: 1.2,
  cardResourceCost: 0.60,
  overBudgetPenalty: 10,
  hopelessChasePenalty: 20,
  opponentPassedLeadBonus: 40,
  finalRoundUrgency: 20,
  synergyBonusScale: 1.0,
  killShotBonus: 6.0,
};

export function getAIWeightsForDifficulty(difficulty: number): UtilityAIWeights {
  if (difficulty <= 2) {
    return EASY_AI_WEIGHTS;
  }
  if (difficulty === 3) {
    return NORMAL_AI_WEIGHTS;
  }
  return HARD_AI_WEIGHTS;
}


export function getOpponentId(playerId: PlayerId): PlayerId {
  return playerId === "player" ? "opponent" : "player";
}

export function isSurvivalRound(state: GameState, playerId: PlayerId): boolean {
  const opponentId = getOpponentId(playerId);
  return (
    state.players[opponentId].roundWins === 1 &&
    state.players[playerId].roundWins === 0
  );
}

export function countBoardUnits(state: GameState, playerId: PlayerId): number {
  const board = state.players[playerId].board;
  return board.melee.length + board.ranged.length + board.siege.length;
}

export function countCardsPlayedThisRound(
  state: GameState,
  playerId: PlayerId,
): number {
  return state.actionLog.filter(
    (entry) =>
      entry.round === state.currentRound &&
      entry.playerId === playerId &&
      entry.message === "PLAY_CARD",
  ).length;
}

function estimateEffectTemplateValue(definition: CardDefinition | undefined): number {
  if (!definition) return 0;

  return definition.effects.reduce((total, effect) => {
    switch (effect.type) {
      case "BUFF":
        return total + effect.amount;
      case "DAMAGE":
        return total + effect.amount;
      case "DESTROY":
        return total + 6;
      case "DRAW_DISCARD":
        return total + effect.draw * 2 - effect.discard;
      case "SUMMON":
        return total + effect.count * 2;
      case "REVIVE":
        return total + 4;
      case "LOCK":
        return total + 3;
      case "CONDITIONAL_BOOST":
        return total + effect.amount * 0.6;
      case "CLEAR_WEATHER":
        return total + 1;
    }
  }, 0);
}

function estimateCardPointImpact(
  state: GameState,
  card: CardInstance,
): number {
  const definition = state.cardDefinitions[card.cardId];
  return Math.max(0, card.currentPower + estimateEffectTemplateValue(definition) * 0.5);
}

function getRarityPremium(definition: CardDefinition | undefined): number {
  switch (definition?.rarity) {
    case "elite":
      return 1;
    case "hero":
      return 2;
    case "legend":
      return 3;
    case "common":
    default:
      return 0;
  }
}

export function estimateCardResourceCost(
  state: GameState,
  card: CardInstance,
): number {
  const definition = state.cardDefinitions[card.cardId];
  const effectValue = estimateEffectTemplateValue(definition);
  return 2 + card.currentPower * 0.35 + effectValue * 0.4 + getRarityPremium(definition);
}

export function evaluateStateForPlayer(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): number {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const player = state.players[playerId];
  const opponent = state.players[opponentId];

  const scoreDiff = scores[playerId] - scores[opponentId];
  const roundWinsDiff = player.roundWins - opponent.roundWins;
  const handAdvantage = player.hand.length - opponent.hand.length;
  const deckAdvantage = player.deck.length - opponent.deck.length;
  const boardUnitAdvantage =
    countBoardUnits(state, playerId) - countBoardUnits(state, opponentId);

  let score =
    scoreDiff * weights.scoreDiff +
    roundWinsDiff * weights.roundWinsDiff +
    handAdvantage * weights.handAdvantage +
    deckAdvantage * weights.deckAdvantage +
    boardUnitAdvantage * weights.boardUnitAdvantage;

  // Hand quality premium (encourage keeping elite/hero/legend cards in early rounds)
  if (state.currentRound < 3 && !isSurvivalRound(state, playerId)) {
    // Player hand quality
    for (const handCard of player.hand) {
      const def = state.cardDefinitions[handCard.cardId];
      if (!def) continue;
      let premium = 0;
      if (def.rarity === "elite") premium = 1.0;
      else if (def.rarity === "hero") premium = 3.0;
      else if (def.rarity === "legend") premium = 6.0;
      score += premium * (weights.handAdvantage * 0.4);
    }
    // Opponent hand quality (minimize opponent's quality, so subtract it)
    for (const handCard of opponent.hand) {
      const def = state.cardDefinitions[handCard.cardId];
      if (!def) continue;
      let premium = 0;
      if (def.rarity === "elite") premium = 1.0;
      else if (def.rarity === "hero") premium = 3.0;
      else if (def.rarity === "legend") premium = 6.0;
      score -= premium * (weights.handAdvantage * 0.4);
    }
  }

  // Kill Shot penalty/bonus (graveyard isDestroyed cards + board units with 0 or less power).
  const countDeadOrDestroyed = (pState: typeof player) => {
    const graveyardCount = pState.graveyard.filter((c) => c.isDestroyed).length;
    const boardCount = [
      ...pState.board.melee,
      ...pState.board.ranged,
      ...pState.board.siege,
    ].filter((c) => c.currentPower <= 0).length;
    return graveyardCount + boardCount;
  };
  const playerDestroyed = countDeadOrDestroyed(player);
  const opponentDestroyed = countDeadOrDestroyed(opponent);
  score += (opponentDestroyed - playerDestroyed) * (weights.killShotBonus ?? 0);

  // Row-buff hand synergy bonus.
  if (weights.synergyBonusScale && weights.synergyBonusScale > 0) {
    for (const handCard of player.hand) {
      const def = state.cardDefinitions[handCard.cardId];
      if (!def) continue;
      for (const effect of def.effects) {
        if (effect.type === "BUFF" && effect.target.type === "ALLY_ROW") {
          const row = effect.target.row;
          const rowCount = player.board[row].filter((c) => !c.isDestroyed).length;
          score += rowCount * effect.amount * weights.synergyBonusScale;
        }
      }
    }
  }

  return score;
}

export function estimateCatchupPlan(
  state: GameState,
  playerId: PlayerId,
): CatchupPlan {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const pointsNeeded = Math.max(0, scores[opponentId] - scores[playerId] + 1);

  if (pointsNeeded === 0) {
    return {
      pointsNeeded: 0,
      cardsNeeded: 0,
      totalEstimatedCost: 0,
      canCatchUp: true,
    };
  }

  const candidates = state.players[playerId].hand
    .map((card) => ({
      card,
      points: estimateCardPointImpact(state, card),
      cost: estimateCardResourceCost(state, card),
    }))
    .filter((candidate) => candidate.points > 0)
    .sort((left, right) => {
      const leftEfficiency = left.points / left.cost;
      const rightEfficiency = right.points / right.cost;
      return rightEfficiency - leftEfficiency;
    });

  let accumulatedPoints = 0;
  let accumulatedCost = 0;
  let cardsNeeded = 0;

  for (const candidate of candidates) {
    accumulatedPoints += candidate.points;
    accumulatedCost += candidate.cost;
    cardsNeeded += 1;

    if (accumulatedPoints >= pointsNeeded) {
      return {
        pointsNeeded,
        cardsNeeded,
        totalEstimatedCost: accumulatedCost,
        canCatchUp: true,
      };
    }
  }

  return {
    pointsNeeded,
    cardsNeeded,
    totalEstimatedCost: accumulatedCost,
    canCatchUp: false,
  };
}

export function getRoundBudget(
  state: GameState,
  playerId: PlayerId,
): RoundBudget {
  const opponentId = getOpponentId(playerId);
  const playerWins = state.players[playerId].roundWins;
  const opponentWins = state.players[opponentId].roundWins;
  const cardsPlayedThisRound = countCardsPlayedThisRound(state, playerId);

  let maxCardsThisRound = 4;
  if (state.currentRound >= 3) {
    maxCardsThisRound = cardsPlayedThisRound + state.players[playerId].hand.length;
  } else if (state.currentRound === 2 && playerWins > opponentWins) {
    maxCardsThisRound = 3;
  } else if (state.currentRound === 2 && playerWins < opponentWins) {
    // Survival round: spend freely to survive
    maxCardsThisRound = cardsPlayedThisRound + state.players[playerId].hand.length;
  }

  return {
    maxCardsThisRound,
    cardsPlayedThisRound,
    isOverBudget: cardsPlayedThisRound >= maxCardsThisRound,
  };
}

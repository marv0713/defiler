import type { GameAction, PlayCardAction } from "../rules/actions";
import { getLegalActions } from "../rules/legalActions";
import { applyAction } from "../rules/reducer";
import { calculateScores } from "../rules/scoring";
import type { GameState, PlayerId } from "../types";
import {
  NORMAL_AI_WEIGHTS,
  countBoardUnits,
  estimateCardResourceCost,
  estimateCatchupPlan,
  evaluateStateForPlayer,
  getOpponentId,
  getRoundBudget,
  isSurvivalRound,
  type UtilityAIWeights,
} from "./aiEvaluation";

export interface ActionScoreBreakdown {
  action: GameAction;
  total: number;
  stateDelta: number;
  resourceDelta: number;
  passValue: number;
  cardCost: number;
  budgetPenalty: number;
  chasePenalty: number;
}

function emptyBreakdown(action: GameAction): ActionScoreBreakdown {
  return {
    action,
    total: Number.NEGATIVE_INFINITY,
    stateDelta: 0,
    resourceDelta: 0,
    passValue: 0,
    cardCost: 0,
    budgetPenalty: 0,
    chasePenalty: 0,
  };
}

function getPlayCardCost(
  state: GameState,
  action: PlayCardAction,
): number {
  const card = state.players[action.playerId].hand.find(
    (handCard) => handCard.instanceId === action.cardInstanceId,
  );
  return card ? estimateCardResourceCost(state, card) : 0;
}

function isHopelessChase(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights,
): boolean {
  if (state.currentRound >= 3) return false;
  if (isSurvivalRound(state, playerId)) return false;

  const catchup = estimateCatchupPlan(state, playerId);
  if (catchup.pointsNeeded === 0) return false;
  if (!catchup.canCatchUp) return true;

  const opponentId = getOpponentId(playerId);
  const opponentPassed = state.players[opponentId].hasPassed;

  if (opponentPassed) {
    const isRound1 = state.currentRound === 1;
    if (isRound1) {
      // In Round 1, only chase if it requires at most 2 cards.
      return catchup.cardsNeeded > Math.min(2, state.players[playerId].hand.length);
    } else {
      // In Round 2, if we can win the match or must win the round to stay alive, chase if we have cards.
      return catchup.cardsNeeded > state.players[playerId].hand.length;
    }
  }

  const budget = getRoundBudget(state, playerId);
  const remainingBudget = Math.max(
    0,
    budget.maxCardsThisRound - budget.cardsPlayedThisRound,
  );

  return (
    catchup.cardsNeeded > Math.max(1, remainingBudget) ||
    catchup.totalEstimatedCost >= weights.hopelessChasePenalty
  );
}

function scorePassAction(
  state: GameState,
  action: GameAction,
  playerId: PlayerId,
  weights: UtilityAIWeights,
): ActionScoreBreakdown {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const lead = scores[playerId] - scores[opponentId];
  const opponentPassed = state.players[opponentId].hasPassed;
  const catchup = estimateCatchupPlan(state, playerId);
  const budget = getRoundBudget(state, playerId);

  // Survival round check: never pass when losing if we still have cards in hand!
  if (isSurvivalRound(state, playerId) && lead <= 0 && state.players[playerId].hand.length > 0) {
    return {
      action,
      total: Number.NEGATIVE_INFINITY,
      stateDelta: 0,
      resourceDelta: 0,
      passValue: Number.NEGATIVE_INFINITY,
      cardCost: 0,
      budgetPenalty: 0,
      chasePenalty: 0,
    };
  }

  let passValue = 0;

  if (opponentPassed && lead > 0) {
    passValue += weights.opponentPassedLeadBonus + lead;
  }

  const hopelessChase = isHopelessChase(state, playerId, weights);

  if (hopelessChase) {
    passValue += weights.hopelessChasePenalty;
  }

  if (lead > 0 && state.currentRound < 3) {
    passValue += Math.min(12, lead);
  }

  if (budget.isOverBudget && state.currentRound < 3) {
    passValue += weights.overBudgetPenalty * 2;
  }

  if (
    lead <= 0 &&
    catchup.canCatchUp &&
    catchup.cardsNeeded <= 1 &&
    !(budget.isOverBudget && state.currentRound < 3)
  ) {
    passValue -= 25;
  }

  if (lead < 0 && !hopelessChase && state.currentRound < 3) {
    passValue -= 12;
  }

  if (lead < 0 && state.currentRound >= 3) {
    passValue -= weights.finalRoundUrgency * 2;
  }

  if (countBoardUnits(state, playerId) === 0 && lead >= 0 && state.currentRound < 3) {
    passValue -= 10;
  }

  return {
    action,
    total: passValue,
    stateDelta: 0,
    resourceDelta: 0,
    passValue,
    cardCost: 0,
    budgetPenalty: 0,
    chasePenalty: 0,
  };
}

function scorePlayAction(
  state: GameState,
  action: PlayCardAction,
  playerId: PlayerId,
  weights: UtilityAIWeights,
): ActionScoreBreakdown {
  const before = evaluateStateForPlayer(state, playerId, weights);
  let nextState: GameState;
  try {
    nextState = applyAction(state, action);
  } catch {
    return emptyBreakdown(action);
  }

  const after = evaluateStateForPlayer(nextState, playerId, weights);
  const stateDelta = after - before;
  const cardCost = getPlayCardCost(state, action) * weights.cardResourceCost;
  const budget = getRoundBudget(state, playerId);
  const budgetPenalty =
    budget.isOverBudget && state.currentRound < 3 ? weights.overBudgetPenalty : 0;
  const chasePenalty = isHopelessChase(state, playerId, weights)
    ? weights.hopelessChasePenalty
    : 0;
  const finalRoundBonus = state.currentRound >= 3 ? weights.finalRoundUrgency : 0;

  const resourceDelta = -cardCost - budgetPenalty - chasePenalty + finalRoundBonus;
  const total = stateDelta + resourceDelta;

  return {
    action,
    total,
    stateDelta,
    resourceDelta,
    passValue: 0,
    cardCost,
    budgetPenalty,
    chasePenalty,
  };
}

export function scoreNormalAIAction(
  state: GameState,
  action: GameAction,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): ActionScoreBreakdown {
  if (action.type === "PASS") {
    return scorePassAction(state, action, playerId, weights);
  }

  if (action.type === "PLAY_CARD") {
    return scorePlayAction(state, action, playerId, weights);
  }

  return emptyBreakdown(action);
}

function getTieBreakCost(state: GameState, action: GameAction): number {
  if (action.type !== "PLAY_CARD") return 0;
  return getPlayCardCost(state, action);
}

function isBetterScore(
  state: GameState,
  playerId: PlayerId,
  candidate: ActionScoreBreakdown,
  current: ActionScoreBreakdown,
): boolean {
  const epsilon = 0.001;
  if (candidate.total > current.total + epsilon) return true;
  if (candidate.total < current.total - epsilon) return false;

  const scores = calculateScores(state);
  const isAhead = scores[playerId] >= scores[getOpponentId(playerId)];

  if (isAhead && candidate.action.type === "PASS" && current.action.type !== "PASS") {
    return true;
  }
  if (isAhead && candidate.action.type !== "PASS" && current.action.type === "PASS") {
    return false;
  }

  return getTieBreakCost(state, candidate.action) < getTieBreakCost(state, current.action);
}

export function chooseUtilityV1AIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  if (legalActions.length === 0) return { type: "PASS", playerId };

  let best = scoreNormalAIAction(state, legalActions[0], playerId, weights);
  for (const action of legalActions.slice(1)) {
    const candidate = scoreNormalAIAction(state, action, playerId, weights);
    if (isBetterScore(state, playerId, candidate, best)) {
      best = candidate;
    }
  }

  return best.action;
}

export function chooseNormalAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  return chooseUtilityV1AIAction(state, playerId, weights);
}

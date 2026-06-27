import type { GameAction, PlayCardAction } from "../rules/actions";
import { getLegalActions } from "../rules/legalActions";
import { applyAction } from "../rules/reducer";
import { calculateScores } from "../rules/scoring";
import type { GameState, PlayerId } from "../types";
import {
  NORMAL_AI_WEIGHTS,
  estimateCardResourceCost,
  estimateCatchupPlan,
  getOpponentId,
  type CatchupPlan,
  type UtilityAIWeights,
} from "./aiEvaluation";
import { scoreNormalAIAction } from "./normalAI";

export type RoundPlan =
  | "concede_round"
  | "cheap_catchup"
  | "contest_round"
  | "bleed_opponent"
  | "must_win"
  | "final_all_in";

export interface RoundPlanResult {
  plan: RoundPlan;
  catchup: CatchupPlan;
  scoreLead: number;
}

function getPlayCardCost(state: GameState, action: PlayCardAction): number {
  const card = state.players[action.playerId].hand.find(
    (handCard) => handCard.instanceId === action.cardInstanceId,
  );
  return card ? estimateCardResourceCost(state, card) : Number.POSITIVE_INFINITY;
}

function actionOvertakes(
  state: GameState,
  action: PlayCardAction,
  playerId: PlayerId,
): boolean {
  const next = applyAction(state, action);
  const scores = calculateScores(next);
  return scores[playerId] > scores[getOpponentId(playerId)];
}

export function getRoundPlan(
  state: GameState,
  playerId: PlayerId,
): RoundPlanResult {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const scoreLead = scores[playerId] - scores[opponentId];
  const player = state.players[playerId];
  const opponent = state.players[opponentId];
  const catchup = estimateCatchupPlan(state, playerId);

  if (state.currentRound >= 3) {
    return { plan: "final_all_in", catchup, scoreLead };
  }

  if (player.roundWins < opponent.roundWins) {
    return { plan: "must_win", catchup, scoreLead };
  }

  if (
    opponent.hasPassed &&
    scoreLead <= 0 &&
    catchup.canCatchUp &&
    catchup.cardsNeeded <= 1
  ) {
    return { plan: "cheap_catchup", catchup, scoreLead };
  }

  if (state.currentRound === 1 && scoreLead < 0 && catchup.cardsNeeded >= 3) {
    return { plan: "concede_round", catchup, scoreLead };
  }

  if (state.currentRound === 2 && player.roundWins > opponent.roundWins) {
    return { plan: "bleed_opponent", catchup, scoreLead };
  }

  return { plan: "contest_round", catchup, scoreLead };
}

function chooseCheapestCatchup(
  state: GameState,
  playerId: PlayerId,
): GameAction | null {
  const candidates = getLegalActions(state, playerId)
    .filter((action): action is PlayCardAction => action.type === "PLAY_CARD")
    .filter((action) => actionOvertakes(state, action, playerId))
    .sort((left, right) => getPlayCardCost(state, left) - getPlayCardCost(state, right));

  return candidates[0] ?? null;
}

function scoreWithPlanBonus(
  state: GameState,
  action: GameAction,
  playerId: PlayerId,
  weights: UtilityAIWeights,
  plan: RoundPlan,
): number {
  const score = scoreNormalAIAction(state, action, playerId, weights);
  if (score.total === Number.NEGATIVE_INFINITY) return score.total;

  if (plan === "final_all_in" && action.type === "PLAY_CARD") {
    return score.total + weights.finalRoundUrgency;
  }

  if (plan === "must_win" && action.type === "PLAY_CARD") {
    return score.total + weights.finalRoundUrgency * 0.5;
  }

  if (plan === "bleed_opponent" && action.type === "PLAY_CARD") {
    return score.total - getPlayCardCost(state, action) * weights.cardResourceCost;
  }

  return score.total;
}

export function chooseRoundStrategyAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  if (legalActions.length === 0) return { type: "PASS", playerId };

  const pass =
    legalActions.find((action) => action.type === "PASS") ??
    ({ type: "PASS", playerId } as const);
  const roundPlan = getRoundPlan(state, playerId).plan;

  if (roundPlan === "concede_round") {
    return pass;
  }

  if (roundPlan === "cheap_catchup") {
    return chooseCheapestCatchup(state, playerId) ?? pass;
  }

  let bestAction = legalActions[0];
  let bestScore = scoreWithPlanBonus(
    state,
    bestAction,
    playerId,
    weights,
    roundPlan,
  );

  for (const action of legalActions.slice(1)) {
    const score = scoreWithPlanBonus(state, action, playerId, weights, roundPlan);
    if (score > bestScore) {
      bestAction = action;
      bestScore = score;
    }
  }

  return bestAction;
}

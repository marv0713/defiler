import type { GameAction } from "../rules/actions";
import { getLegalActions } from "../rules/legalActions";
import { applyAction } from "../rules/reducer";
import type { GameState, PlayerId } from "../types";
import {
  NORMAL_AI_WEIGHTS,
  evaluateStateForPlayer,
  getOpponentId,
  isSurvivalRound,
  type UtilityAIWeights,
} from "./aiEvaluation";
import { chooseUtilityV1AIAction, scoreNormalAIAction } from "./normalAI";
import { calculateScores } from "../rules/scoring";

export function chooseLookahead1PlyAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  if (legalActions.length === 0) return { type: "PASS", playerId };

  const before = evaluateStateForPlayer(state, playerId, weights);
  let bestAction = legalActions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const action of legalActions) {
    try {
      const immediate = scoreNormalAIAction(state, action, playerId, weights);
      if (immediate.total === Number.NEGATIVE_INFINITY) continue;

      const afterAI = applyAction(state, action);
      let projected = afterAI;
      const opponentId = getOpponentId(playerId);

      if (
        afterAI.status === "playing" &&
        afterAI.currentPlayerId === opponentId
      ) {
        const opponentAction = chooseUtilityV1AIAction(
          afterAI,
          opponentId,
          NORMAL_AI_WEIGHTS,
        );
        projected = applyAction(afterAI, opponentAction);
      }

      const score =
        evaluateStateForPlayer(projected, playerId, weights) -
        before +
        immediate.resourceDelta;

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    } catch {
      // Ignore invalid projected branches. Legal actions should normally be
      // safe, but test fixtures can contain incomplete card definitions.
    }
  }

  return bestAction;
}

export function chooseLookahead3PlyAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  if (legalActions.length === 0) return { type: "PASS", playerId };

  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const lead = scores[playerId] - scores[opponentId];
  const isSurvival = isSurvivalRound(state, playerId);

  if (isSurvival && lead <= 0 && state.players[playerId].hand.length > 0) {
    const playActions = legalActions.filter((action) => action.type !== "PASS");
    if (playActions.length > 0) {
      return evaluate3PlyMoves(state, playerId, playActions, weights);
    }
  }

  return evaluate3PlyMoves(state, playerId, legalActions, weights);
}

function evaluate3PlyMoves(
  state: GameState,
  playerId: PlayerId,
  actions: GameAction[],
  weights: UtilityAIWeights,
): GameAction {
  const before = evaluateStateForPlayer(state, playerId, weights);
  let bestAction = actions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const action of actions) {
    try {
      const immediate = scoreNormalAIAction(state, action, playerId, weights);
      if (immediate.total === Number.NEGATIVE_INFINITY) continue;

      const afterAI = applyAction(state, action);
      let score = 0;

      if (afterAI.status !== "playing") {
        score = evaluateStateForPlayer(afterAI, playerId, weights) - before + immediate.resourceDelta;
      } else {
        const opponentId = getOpponentId(playerId);
        const opponentActions = getLegalActions(afterAI, opponentId);
        
        if (opponentActions.length === 0) {
          score = evaluateStateForPlayer(afterAI, playerId, weights) - before + immediate.resourceDelta;
        } else {
          // Sort opponent responses using 1-ply utility score from opponent's perspective,
          // then choose the top 2 responses to simulate deeper.
          const opponentScored = opponentActions.map((opAction) => {
            const opImmediate = scoreNormalAIAction(afterAI, opAction, opponentId, weights);
            return { action: opAction, score: opImmediate.total };
          }).filter((x) => x.score !== Number.NEGATIVE_INFINITY)
            .sort((a, b) => b.score - a.score);

          if (opponentScored.length === 0) {
            score = evaluateStateForPlayer(afterAI, playerId, weights) - before + immediate.resourceDelta;
          } else {
            const topOpponentMoves = opponentScored.slice(0, 2);
            let minScoreForAI = Number.POSITIVE_INFINITY;

            for (const opMove of topOpponentMoves) {
              const afterOpponent = applyAction(afterAI, opMove.action);
              let bestAIResponseScore = Number.NEGATIVE_INFINITY;

              if (afterOpponent.status !== "playing") {
                bestAIResponseScore = evaluateStateForPlayer(afterOpponent, playerId, weights) - before + immediate.resourceDelta;
              } else {
                // AI's turn to counter-play (Step 3)
                const aiResponses = getLegalActions(afterOpponent, playerId);
                if (aiResponses.length === 0) {
                  bestAIResponseScore = evaluateStateForPlayer(afterOpponent, playerId, weights) - before + immediate.resourceDelta;
                } else {
                  for (const aiResp of aiResponses) {
                    const aiRespImmediate = scoreNormalAIAction(afterOpponent, aiResp, playerId, weights);
                    if (aiRespImmediate.total === Number.NEGATIVE_INFINITY) continue;

                    const projected = applyAction(afterOpponent, aiResp);
                    const respScore = evaluateStateForPlayer(projected, playerId, weights) - before + immediate.resourceDelta;
                    if (respScore > bestAIResponseScore) {
                      bestAIResponseScore = respScore;
                    }
                  }
                }
              }

              if (bestAIResponseScore < minScoreForAI) {
                minScoreForAI = bestAIResponseScore;
              }
            }

            score = minScoreForAI;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    } catch {
      // Ignore invalid projected branches
    }
  }

  return bestAction;
}


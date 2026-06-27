import type { GameAction } from "../rules/actions";
import type { GameState, PlayerId } from "../types";
import type { UtilityAIWeights } from "./aiEvaluation";
import { chooseLookahead1PlyAIAction, chooseLookahead3PlyAIAction } from "./lookaheadAI";
import { chooseUtilityV1AIAction } from "./normalAI";
import { chooseRoundStrategyAIAction } from "./roundStrategyAI";

export type AIId = "utility-v1" | "round-strategy" | "lookahead-1ply" | "lookahead-3ply";

export interface AIContext {
  state: GameState;
  playerId: PlayerId;
  weights?: UtilityAIWeights;
}

export interface AIStrategy {
  id: AIId;
  label: string;
  chooseAction: (context: AIContext) => GameAction;
}

const utilityV1Strategy: AIStrategy = {
  id: "utility-v1",
  label: "Utility V1",
  chooseAction: ({ state, playerId, weights }) =>
    chooseUtilityV1AIAction(state, playerId, weights),
};

const roundStrategy: AIStrategy = {
  id: "round-strategy",
  label: "Round Strategy",
  chooseAction: ({ state, playerId, weights }) =>
    chooseRoundStrategyAIAction(state, playerId, weights),
};

const lookahead1PlyStrategy: AIStrategy = {
  id: "lookahead-1ply",
  label: "Lookahead 1-Ply",
  chooseAction: ({ state, playerId, weights }) =>
    chooseLookahead1PlyAIAction(state, playerId, weights),
};

const lookahead3PlyStrategy: AIStrategy = {
  id: "lookahead-3ply",
  label: "Lookahead 3-Ply",
  chooseAction: ({ state, playerId, weights }) =>
    chooseLookahead3PlyAIAction(state, playerId, weights),
};

const STRATEGIES: Record<AIId, AIStrategy> = {
  "utility-v1": utilityV1Strategy,
  "round-strategy": roundStrategy,
  "lookahead-1ply": lookahead1PlyStrategy,
  "lookahead-3ply": lookahead3PlyStrategy,
};

export function getAIStrategy(aiId: AIId): AIStrategy {
  return STRATEGIES[aiId];
}

export function chooseAIAction(
  context: AIContext & { aiId?: AIId },
): GameAction {
  return getAIStrategy(context.aiId ?? "utility-v1").chooseAction(context);
}

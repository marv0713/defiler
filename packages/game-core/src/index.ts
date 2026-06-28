export const GAME_CORE_VERSION = "0.0.0";

export { INITIAL_CARDS } from "./cards/cardData";
export { validateCards } from "./cards/cardValidation";
export { FACTIONS, MAX_ROUND_WINS, ROWS, STARTING_HAND_SIZE, DECK_SIZE, ROUND_DRAW_COUNTS } from "./constants";
export { EFFECT_TYPES } from "./effects/effectTypes";
export { resolveTargets } from "./effects/targetResolver";
export { resolveEffects } from "./effects/effectResolver";
export { createInitialGameState } from "./rules/gameInit";
export { getLegalActions } from "./rules/legalActions";
export { applyAction } from "./rules/reducer";
export { settleRound, startNextRound } from "./rules/round";
export { calculatePlayerScore, calculateRowScore, calculateScores } from "./rules/scoring";
export { createSeededRandom, shuffleWithSeed } from "./utils/random";
export { chooseSimpleAIAction } from "./ai/simpleAI";
export { chooseHeuristicAIAction } from "./ai/heuristicAI";
export {
  chooseNormalAIAction,
  chooseUtilityV1AIAction,
  scoreNormalAIAction,
} from "./ai/normalAI";
export {
  chooseAIAction,
  getAIStrategy,
} from "./ai/aiStrategy";
export { classifyCardRoles } from "./ai/cardRoles";
export {
  chooseRoundStrategyAIAction,
  getRoundPlan,
} from "./ai/roundStrategyAI";
export { chooseLookahead1PlyAIAction, chooseLookahead3PlyAIAction } from "./ai/lookaheadAI";
export { compareAIStrategies } from "./ai/aiComparison";
export { NORMAL_AI_WEIGHTS, EASY_AI_WEIGHTS, HARD_AI_WEIGHTS, getAIWeightsForDifficulty } from "./ai/aiEvaluation";
export { simulateGame } from "./simulator/simulateGame";
export { formatSimulationReport } from "./simulator/report";
export { simulateMatchup } from "./simulator/simulateMatchup";
export { CAMPAIGN_LEVELS } from "./campaign/levelData";
export { getCampaignCardPool, getFactionDeckStats, isLevelUnlocked } from "./campaign/campaignHelpers";
export type { FactionDeckStats } from "./campaign/campaignHelpers";
export type { DeckConstraint, LevelDefinition, WinCondition } from "./campaign/levelTypes";


export type {
  BoardState,
  CardDefinition,
  CardInstance,
  CardType,
  Faction,
  GameActionLogEntry,
  GameState,
  GameStatus,
  PlayerId,
  PlayerState,
  PowerModifier,
  Rarity,
  Row,
  WeatherState,
} from "./types";
export type {
  BuffEffect,
  ClearWeatherEffect,
  ConditionDefinition,
  ConditionalBoostEffect,
  DamageEffect,
  DestroyEffect,
  DrawDiscardEffect,
  EffectContext,
  EffectDefinition,
  EffectType,
  LockEffect,
  ManualTargetRule,
  ReviveEffect,
  SummonEffect,
  TargetSelector,
} from "./effects/effectTypes";
export type {
  ActionTarget,
  DiscardCardAction,
  GameAction,
  PassAction,
  PlayCardAction,
  RestartGameAction,
  StartNextRoundAction,
} from "./rules/actions";
export type { ValidationResult } from "./cards/cardValidation";
export type { CreateGameConfig } from "./rules/gameInit";
export type {
  ActionScoreBreakdown,
} from "./ai/normalAI";
export type {
  AIContext,
  AIId,
  AIStrategy,
} from "./ai/aiStrategy";
export type { CardRole } from "./ai/cardRoles";
export type {
  RoundPlan,
  RoundPlanResult,
} from "./ai/roundStrategyAI";
export type {
  AIComparisonConfig,
  AIComparisonReport,
  AIComparisonSide,
} from "./ai/aiComparison";
export type {
  CatchupPlan,
  RoundBudget,
  UtilityAIWeights,
} from "./ai/aiEvaluation";
export type {
  SimulateActionSummary,
  SimulateGameConfig,
  SimulateGameResult,
  SimulateGameStoppedReason,
} from "./simulator/simulateGame";
export type {
  CardSimulationStats,
  SimulationConfig,
  SimulationReport,
} from "./simulator/simulateMatchup";

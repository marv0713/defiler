export const GAME_CORE_VERSION = "0.0.0";

export { INITIAL_CARDS } from "./cards/cardData";
export { validateCards } from "./cards/cardValidation";
export { FACTIONS, MAX_ROUND_WINS, ROWS, STARTING_HAND_SIZE } from "./constants";
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
  GameAction,
  PassAction,
  PlayCardAction,
  RestartGameAction,
  StartNextRoundAction,
} from "./rules/actions";
export type { ValidationResult } from "./cards/cardValidation";
export type { CreateGameConfig } from "./rules/gameInit";

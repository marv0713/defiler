export const GAME_CORE_VERSION = "0.0.0";

export { FACTIONS, MAX_ROUND_WINS, ROWS, STARTING_HAND_SIZE } from "./constants";
export { createInitialGameState } from "./rules/gameInit";
export { getLegalActions } from "./rules/legalActions";
export { applyAction } from "./rules/reducer";
export { settleRound, startNextRound } from "./rules/round";
export { calculatePlayerScore, calculateRowScore, calculateScores } from "./rules/scoring";
export { createSeededRandom, shuffleWithSeed } from "./utils/random";

export type {
  BoardState,
  CardDefinition,
  CardInstance,
  CardType,
  EffectDefinition,
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
  ActionTarget,
  GameAction,
  PassAction,
  PlayCardAction,
  RestartGameAction,
  StartNextRoundAction,
} from "./rules/actions";
export type { CreateGameConfig } from "./rules/gameInit";

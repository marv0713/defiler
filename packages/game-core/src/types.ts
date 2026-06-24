import type { EffectDefinition } from "./effects/effectTypes";

export type PlayerId = "player" | "opponent";

export type Faction = "qin" | "chu" | "qi" | "zhao" | "neutral";

export type Row = "melee" | "ranged" | "siege";

export type CardType = "unit" | "special" | "weather";

export type Rarity = "common" | "elite" | "hero" | "legend";

export type GameStatus =
  | "not_started"
  | "playing"
  | "round_finished"
  | "game_finished";

export interface CardDefinition {
  id: string;
  name: string;
  englishName: string;
  nameTextId?: string;
  descriptionTextId?: string;
  faction: Faction;
  type: CardType;
  row?: Row;
  power: number;
  rarity: Rarity;
  tags: string[];
  effects: EffectDefinition[];
  budget?: number;
  description: string;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  ownerId: PlayerId;
  type: CardType;
  row?: Row;
  currentPower: number;
  basePower: number;
  isLocked: boolean;
  isDestroyed: boolean;
  modifiers: PowerModifier[];
}

export interface PowerModifier {
  id: string;
  sourceCardInstanceId?: string;
  amount: number;
  type: "buff" | "damage" | "weather" | "aura";
  expiresAt: "round_end" | "game_end" | "never";
}

export interface BoardState {
  melee: CardInstance[];
  ranged: CardInstance[];
  siege: CardInstance[];
}

export interface PlayerState {
  id: PlayerId;
  faction: Faction;
  deck: CardInstance[];
  hand: CardInstance[];
  board: BoardState;
  graveyard: CardInstance[];
  hasPassed: boolean;
  roundWins: number;
}

export interface GameActionLogEntry {
  id: string;
  message: string;
  playerId?: PlayerId;
  round: number;
  cardInstanceId?: string;
  cardId?: string;
}

export interface WeatherState {
  affectedRows: Row[];
}

export interface GameState {
  id: string;
  seed: string;
  status: GameStatus;
  currentRound: number;
  currentPlayerId: PlayerId;
  players: Record<PlayerId, PlayerState>;
  winnerId?: PlayerId;
  roundWinnerId?: PlayerId;
  actionLog: GameActionLogEntry[];
  weather?: WeatherState;
  cardDefinitions: Record<string, CardDefinition>;
}

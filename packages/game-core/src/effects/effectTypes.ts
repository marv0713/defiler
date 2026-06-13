import type { PlayerId, Row } from "../types";

export const EFFECT_TYPES = [
  "BUFF",
  "DAMAGE",
  "DESTROY",
  "DRAW_DISCARD",
  "SUMMON",
  "REVIVE",
  "LOCK",
  "CLEAR_WEATHER",
  "CONDITIONAL_BOOST",
] as const;

export type EffectType = (typeof EFFECT_TYPES)[number];

export interface BuffEffect {
  type: "BUFF";
  target: TargetSelector;
  amount: number;
}

export interface DamageEffect {
  type: "DAMAGE";
  target: TargetSelector;
  amount: number;
}

export interface DestroyEffect {
  type: "DESTROY";
  target: TargetSelector;
}

export interface DrawDiscardEffect {
  type: "DRAW_DISCARD";
  draw: number;
  discard: number;
}

export interface SummonEffect {
  type: "SUMMON";
  cardId: string;
  row: Row;
  count: number;
}

export interface ReviveEffect {
  type: "REVIVE";
  target: TargetSelector;
  maxPower?: number;
}

export interface LockEffect {
  type: "LOCK";
  target: TargetSelector;
}

export interface ClearWeatherEffect {
  type: "CLEAR_WEATHER";
}

export interface ConditionalBoostEffect {
  type: "CONDITIONAL_BOOST";
  condition: ConditionDefinition;
  amount: number;
}

export type EffectDefinition =
  | BuffEffect
  | DamageEffect
  | DestroyEffect
  | DrawDiscardEffect
  | SummonEffect
  | ReviveEffect
  | LockEffect
  | ClearWeatherEffect
  | ConditionalBoostEffect;

export type ManualTargetRule =
  | {
      type: "ANY_UNIT";
    }
  | {
      type: "ALLY_UNIT";
    }
  | {
      type: "ENEMY_UNIT";
    };

export type TargetSelector =
  | { type: "SELF" }
  | { type: "ALLY_LOWEST" }
  | { type: "ALLY_RANDOM"; count: number }
  | { type: "ALLY_ROW"; row: Row }
  | { type: "ENEMY_LOWEST" }
  | { type: "ENEMY_HIGHEST" }
  | { type: "ENEMY_RANDOM"; count: number }
  | { type: "ENEMY_ROW"; row: Row }
  | { type: "MANUAL"; allowed: ManualTargetRule };

export type ConditionDefinition =
  | {
      type: "SCORE_AHEAD";
    }
  | {
      type: "SCORE_BEHIND";
    }
  | {
      type: "OPPONENT_PASSED";
    }
  | {
      type: "ALLY_UNIT_COUNT_AT_LEAST";
      count: number;
    };

export interface EffectContext {
  sourcePlayerId: PlayerId;
  opponentPlayerId: PlayerId;
  random: () => number;
}

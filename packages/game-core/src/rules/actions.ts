import type { PlayerId, Row } from "../types";

export type ActionTarget =
  | {
      type: "row";
      playerId: PlayerId;
      row: Row;
    }
  | {
      type: "card";
      cardInstanceId: string;
    }
  | {
      type: "player";
      playerId: PlayerId;
    };

export interface PlayCardAction {
  type: "PLAY_CARD";
  playerId: PlayerId;
  cardInstanceId: string;
  target?: ActionTarget;
}

export interface PassAction {
  type: "PASS";
  playerId: PlayerId;
}

export interface StartNextRoundAction {
  type: "START_NEXT_ROUND";
}

export interface RestartGameAction {
  type: "RESTART_GAME";
}

export type GameAction =
  | PlayCardAction
  | PassAction
  | StartNextRoundAction
  | RestartGameAction;

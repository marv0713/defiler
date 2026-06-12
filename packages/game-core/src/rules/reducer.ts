import type { GameAction, PlayCardAction } from "./actions";
import { getLegalActions } from "./legalActions";
import { settleRound, startNextRound } from "./round";
import type {
  GameActionLogEntry,
  GameState,
  PlayerId,
  PlayerState,
} from "../types";

function getOpponentId(playerId: PlayerId): PlayerId {
  return playerId === "player" ? "opponent" : "player";
}

function isSameAction(left: GameAction, right: GameAction): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertLegalAction(state: GameState, action: GameAction): void {
  if (action.type === "RESTART_GAME") {
    throw new Error(`${action.type} is not implemented yet.`);
  }

  if (action.type === "START_NEXT_ROUND") {
    if (state.status !== "round_finished") {
      throw new Error("Cannot start next round unless the round is finished.");
    }

    return;
  }

  const legalActions = getLegalActions(state, action.playerId);

  if (!legalActions.some((legalAction) => isSameAction(legalAction, action))) {
    throw new Error(`Illegal action: ${action.type}`);
  }
}

function createActionLogEntry(
  state: GameState,
  action: GameAction,
): GameActionLogEntry {
  return {
    id: `action-${state.actionLog.length + 1}`,
    message: action.type,
    playerId: "playerId" in action ? action.playerId : undefined,
    round: state.currentRound,
  };
}

function replacePlayer(
  state: GameState,
  playerId: PlayerId,
  player: PlayerState,
): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: player,
    },
  };
}

function getNextPlayerId(state: GameState, playerId: PlayerId): PlayerId {
  const opponentId = getOpponentId(playerId);

  if (state.players[opponentId].hasPassed) {
    return playerId;
  }

  return opponentId;
}

function applyPlayCard(state: GameState, action: PlayCardAction): GameState {
  const player = state.players[action.playerId];
  const card = player.hand.find(
    (handCard) => handCard.instanceId === action.cardInstanceId,
  );

  if (!card) {
    throw new Error(`Card not found in hand: ${action.cardInstanceId}`);
  }

  const nextHand = player.hand.filter(
    (handCard) => handCard.instanceId !== action.cardInstanceId,
  );
  let nextBoard = player.board;
  let nextGraveyard = player.graveyard;

  if (card.type === "unit") {
    const row = action.target?.type === "row" ? action.target.row : card.row;

    if (!row) {
      throw new Error(`Unit card has no row: ${card.instanceId}`);
    }

    nextBoard = {
      ...player.board,
      [row]: [...player.board[row], card],
    };
  } else {
    nextGraveyard = [...player.graveyard, card];
  }

  const nextPlayer: PlayerState = {
    ...player,
    hand: nextHand,
    board: nextBoard,
    graveyard: nextGraveyard,
  };

  const nextState = replacePlayer(state, action.playerId, nextPlayer);

  return {
    ...nextState,
    currentPlayerId: getNextPlayerId(nextState, action.playerId),
  };
}

function applyPass(state: GameState, playerId: PlayerId): GameState {
  const player = state.players[playerId];
  const nextPlayer: PlayerState = {
    ...player,
    hasPassed: true,
  };
  const nextState = replacePlayer(state, playerId, nextPlayer);

  const passedState: GameState = {
    ...nextState,
    currentPlayerId: getNextPlayerId(nextState, playerId),
  };

  if (
    passedState.players.player.hasPassed &&
    passedState.players.opponent.hasPassed
  ) {
    return settleRound(passedState);
  }

  return passedState;
}

export function applyAction(state: GameState, action: GameAction): GameState {
  assertLegalAction(state, action);

  let nextState: GameState;

  switch (action.type) {
    case "PLAY_CARD":
      nextState = applyPlayCard(state, action);
      break;
    case "PASS":
      nextState = applyPass(state, action.playerId);
      break;
    case "START_NEXT_ROUND":
      nextState = startNextRound(state);
      break;
    case "RESTART_GAME":
      throw new Error("RESTART_GAME is not implemented yet.");
  }

  return {
    ...nextState,
    actionLog: [...state.actionLog, createActionLogEntry(state, action)],
  };
}

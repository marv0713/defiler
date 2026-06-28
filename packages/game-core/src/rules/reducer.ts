import type { GameAction, PlayCardAction, DiscardCardAction } from "./actions";
import { getLegalActions } from "./legalActions";
import { settleRound, startNextRound } from "./round";
import { resolveEffects } from "../effects/effectResolver";
import { createSeededRandom } from "../utils/random";
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
  const playedCard = action.type === "PLAY_CARD"
    ? state.players[action.playerId].hand.find(
        (card) => card.instanceId === action.cardInstanceId,
      )
    : undefined;

  return {
    id: `action-${state.actionLog.length + 1}`,
    message: action.type,
    playerId: "playerId" in action ? action.playerId : undefined,
    round: state.currentRound,
    cardInstanceId: playedCard?.instanceId,
    cardId: playedCard?.cardId,
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

  let nextState = replacePlayer(state, action.playerId, nextPlayer);

  // Resolve card effects
  const effects = card.isLocked
    ? []
    : (state.cardDefinitions[card.cardId]?.effects ?? []);
  if (effects.length > 0) {
    const random = createSeededRandom(
      `${nextState.seed}-fx-${nextState.actionLog.length}`,
    );
    const context = {
      sourcePlayerId: action.playerId,
      opponentPlayerId: getOpponentId(action.playerId),
      random,
    };
    nextState = resolveEffects(nextState, context, effects, card.instanceId);
  }

  return {
    ...nextState,
    // Don't switch turn if the player needs to discard first.
    currentPlayerId: nextState.pendingDiscard
      ? action.playerId
      : getNextPlayerId(nextState, action.playerId),
  };
}

function applyDiscardCard(
  state: GameState,
  action: DiscardCardAction,
): GameState {
  if (!state.pendingDiscard) {
    throw new Error("No pending discard.");
  }
  if (state.pendingDiscard.playerId !== action.playerId) {
    throw new Error("Not your discard turn.");
  }

  const player = state.players[action.playerId];
  const cardIndex = player.hand.findIndex(
    (c) => c.instanceId === action.cardInstanceId,
  );
  if (cardIndex === -1) {
    throw new Error("Card not in hand for discard.");
  }

  const discardedCard = { ...player.hand[cardIndex], isDestroyed: false };
  const nextHand = [
    ...player.hand.slice(0, cardIndex),
    ...player.hand.slice(cardIndex + 1),
  ];
  const nextCount = state.pendingDiscard.count - 1;

  let nextState: GameState = {
    ...state,
    pendingDiscard: nextCount > 0
      ? { playerId: action.playerId, count: nextCount }
      : undefined,
    players: {
      ...state.players,
      [action.playerId]: {
        ...player,
        hand: nextHand,
        graveyard: [...player.graveyard, discardedCard],
      },
    },
  };

  // If all discards done, switch turn (or settle round).
  if (nextCount <= 0) {
    nextState = {
      ...nextState,
      currentPlayerId: getNextPlayerId(nextState, action.playerId),
    };
    // Check if both passed after discard → settle round.
    if (
      nextState.players.player.hasPassed &&
      nextState.players.opponent.hasPassed
    ) {
      nextState = settleRound(nextState);
    }
  }

  return nextState;
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
    case "DISCARD_CARD":
      nextState = applyDiscardCard(state, action);
      break;
  }

  return {
    ...nextState,
    actionLog: [...state.actionLog, createActionLogEntry(state, action)],
  };
}

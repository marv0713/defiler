import { MAX_ROUND_WINS } from "../constants";
import { calculateScores } from "./scoring";
import type {
  BoardState,
  CardInstance,
  GameState,
  PlayerId,
  PlayerState,
} from "../types";

function createEmptyBoard(): BoardState {
  return {
    melee: [],
    ranged: [],
    siege: [],
  };
}

function getRoundWinnerId(state: GameState): PlayerId | undefined {
  const scores = calculateScores(state);

  if (scores.player === scores.opponent) {
    return undefined;
  }

  return scores.player > scores.opponent ? "player" : "opponent";
}

function collectBoardCards(board: BoardState): CardInstance[] {
  return [...board.melee, ...board.ranged, ...board.siege];
}

function clearBoardForNextRound(player: PlayerState): PlayerState {
  return {
    ...player,
    board: createEmptyBoard(),
    graveyard: [...player.graveyard, ...collectBoardCards(player.board)],
    hasPassed: false,
  };
}

export function settleRound(state: GameState): GameState {
  const roundWinnerId = getRoundWinnerId(state);
  const players = {
    ...state.players,
  };

  if (roundWinnerId) {
    players[roundWinnerId] = {
      ...players[roundWinnerId],
      roundWins: players[roundWinnerId].roundWins + 1,
    };
  }

  const winnerId =
    roundWinnerId && players[roundWinnerId].roundWins >= MAX_ROUND_WINS
      ? roundWinnerId
      : undefined;

  return {
    ...state,
    status: winnerId ? "game_finished" : "round_finished",
    players,
    roundWinnerId,
    winnerId,
  };
}

export function startNextRound(state: GameState): GameState {
  if (state.status === "game_finished") {
    return state;
  }

  const nextFirstPlayerId = state.roundWinnerId ?? state.currentPlayerId;

  return {
    ...state,
    status: "playing",
    currentRound: state.currentRound + 1,
    currentPlayerId: nextFirstPlayerId,
    roundWinnerId: undefined,
    players: {
      player: clearBoardForNextRound(state.players.player),
      opponent: clearBoardForNextRound(state.players.opponent),
    },
  };
}

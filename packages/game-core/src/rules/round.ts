import { MAX_ROUND_WINS, ROUND_DRAW_COUNTS } from "../constants";
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

/**
 * Draw `count` cards from the top of the player's remaining deck into hand.
 * If fewer cards are available than requested, all remaining cards are drawn.
 */
function drawForNextRound(player: PlayerState, count: number): PlayerState {
  if (count <= 0) return player;
  const drawn = player.deck.slice(0, count);
  return {
    ...player,
    deck: player.deck.slice(count),
    hand: [...player.hand, ...drawn],
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

  const matchWinnerId =
    roundWinnerId && players[roundWinnerId].roundWins >= MAX_ROUND_WINS
      ? roundWinnerId
      : undefined;

  // MVP termination guarantee: in a best-of-3 the final round is round 3
  // (`MAX_ROUND_WINS * 2 - 1`). If we reach it without a match winner, the
  // game must still terminate. We break the deadlock by awarding the match to
  // the player with more round wins so far; only when round wins are also
  // tied (true 0-0 draw) do we fall back to opponent-wins, preserving the
  // original "always terminates" guarantee.
  const isFinalRoundDraw =
    !matchWinnerId && state.currentRound >= MAX_ROUND_WINS * 2 - 1;

  let tiebreakWinnerId: PlayerId | undefined;
  if (isFinalRoundDraw) {
    const playerWins = players.player.roundWins;
    const opponentWins = players.opponent.roundWins;
    if (playerWins > opponentWins) {
      tiebreakWinnerId = "player";
    } else if (opponentWins > playerWins) {
      tiebreakWinnerId = "opponent";
    } else {
      // Round wins tied — fall back to opponent-wins so the game always ends,
      // and bump opponent's roundWins so winnerId/roundWins stay consistent.
      tiebreakWinnerId = "opponent";
      players["opponent"] = {
        ...players["opponent"],
        roundWins: players["opponent"].roundWins + 1,
      };
    }
  }

  const finalWinnerId = matchWinnerId ?? tiebreakWinnerId;

  return {
    ...state,
    status: finalWinnerId ? "game_finished" : "round_finished",
    players,
    roundWinnerId,
    winnerId: finalWinnerId,
  };
}

export function startNextRound(state: GameState): GameState {
  if (state.status === "game_finished") {
    return state;
  }

  const nextRound = state.currentRound + 1;
  const nextFirstPlayerId = state.roundWinnerId ?? state.currentPlayerId;
  const drawCount = ROUND_DRAW_COUNTS[nextRound] ?? 0;

  return {
    ...state,
    status: "playing",
    currentRound: nextRound,
    currentPlayerId: nextFirstPlayerId,
    roundWinnerId: undefined,
    players: {
      player: drawForNextRound(
        clearBoardForNextRound(state.players.player),
        drawCount,
      ),
      opponent: drawForNextRound(
        clearBoardForNextRound(state.players.opponent),
        drawCount,
      ),
    },
  };
}

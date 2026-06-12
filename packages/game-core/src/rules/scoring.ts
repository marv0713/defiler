import { ROWS } from "../constants";
import type { CardInstance, GameState, PlayerId, PlayerState } from "../types";

export function calculateRowScore(cards: CardInstance[]): number {
  return cards.reduce((score, card) => {
    if (card.isDestroyed) {
      return score;
    }

    return score + card.currentPower;
  }, 0);
}

export function calculatePlayerScore(player: PlayerState): number {
  return ROWS.reduce(
    (score, row) => score + calculateRowScore(player.board[row]),
    0,
  );
}

export function calculateScores(state: GameState): Record<PlayerId, number> {
  return {
    player: calculatePlayerScore(state.players.player),
    opponent: calculatePlayerScore(state.players.opponent),
  };
}

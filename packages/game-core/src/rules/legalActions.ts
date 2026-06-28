import type { GameAction } from "./actions";
import type { GameState, PlayerId } from "../types";

export function getLegalActions(
  state: GameState,
  playerId: PlayerId,
): GameAction[] {
  if (state.status !== "playing") {
    return [];
  }

  if (state.currentPlayerId !== playerId) {
    return [];
  }

  // When the game is waiting for a discard, only discard actions are legal.
  if (state.pendingDiscard) {
    if (state.pendingDiscard.playerId !== playerId) return [];
    return state.players[playerId].hand.map((card) => ({
      type: "DISCARD_CARD" as const,
      playerId,
      cardInstanceId: card.instanceId,
    }));
  }

  const player = state.players[playerId];

  if (player.hasPassed) {
    return [];
  }

  const actions: GameAction[] = [
    {
      type: "PASS",
      playerId,
    },
  ];

  for (const card of player.hand) {
    if (card.type === "unit") {
      if (!card.row) {
        continue;
      }

      actions.push({
        type: "PLAY_CARD",
        playerId,
        cardInstanceId: card.instanceId,
        target: {
          type: "row",
          playerId,
          row: card.row,
        },
      });
      continue;
    }

    actions.push({
      type: "PLAY_CARD",
      playerId,
      cardInstanceId: card.instanceId,
    });
  }

  return actions;
}

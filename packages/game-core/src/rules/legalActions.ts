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

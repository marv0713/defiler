import type { GameAction, PassAction } from "../rules/actions";
import type { GameState, PlayerId } from "../types";
import { getLegalActions } from "../rules/legalActions";
import { createSeededRandom } from "../utils/random";

/**
 * Chooses a legal action for the given player using a simple random strategy.
 *
 * Strategy:
 *   1. Get all legal actions.
 *   2. Separate play actions from the pass action.
 *   3. If any play actions exist, pick one at random (seeded, deterministic).
 *   4. Otherwise pass.
 *
 * This AI makes no attempt to evaluate card value — it is intentionally
 * minimal so it can complete full games without crashing.
 */
export function chooseSimpleAIAction(
  state: GameState,
  playerId: PlayerId,
): GameAction {
  const legal = getLegalActions(state, playerId);

  // Defensive fallback — should never happen during normal play.
  if (legal.length === 0) {
    return { type: "PASS", playerId } satisfies PassAction;
  }

  const playActions = legal.filter((a) => a.type === "PLAY_CARD");

  if (playActions.length === 0) {
    return { type: "PASS", playerId } satisfies PassAction;
  }

  // Use a seeded random so replays with the same seed produce the same game.
  const seed = `${state.seed}-ai-${playerId}-${state.actionLog.length}`;
  const random = createSeededRandom(seed);
  const index = Math.floor(random() * playActions.length);

  return playActions[index] as GameAction;
}

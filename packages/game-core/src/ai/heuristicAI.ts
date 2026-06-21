import type { PlayCardAction } from "../rules/actions";
import type { GameAction } from "../rules/actions";
import type { CardDefinition, CardInstance, GameState, PlayerId } from "../types";
import { getLegalActions } from "../rules/legalActions";
import { calculateScores } from "../rules/scoring";

function getOpponentId(playerId: PlayerId): PlayerId {
  return playerId === "player" ? "opponent" : "player";
}

function countBoardUnits(state: GameState, playerId: PlayerId): number {
  const board = state.players[playerId].board;
  return board.melee.length + board.ranged.length + board.siege.length;
}

/**
 * Rough estimate of the value of playing a card this turn.
 * Used to prefer higher-impact plays over low-impact fillers.
 */
function estimateCardValue(
  card: CardInstance,
  def: CardDefinition | undefined,
): number {
  let value = card.currentPower;
  if (!def) return value;

  for (const effect of def.effects) {
    switch (effect.type) {
      case "BUFF":             value += effect.amount * 0.7; break;
      case "DAMAGE":           value += effect.amount * 0.5; break;
      case "DESTROY":          value += 4; break;
      case "DRAW_DISCARD":     value += effect.draw * 1.5; break;
      case "SUMMON":           value += effect.count * 1.5; break;
      case "REVIVE":           value += 3; break;
      case "LOCK":             value += 2; break;
      case "CONDITIONAL_BOOST": value += effect.amount * 0.4; break;
      case "CLEAR_WEATHER":    value += 1; break;
    }
  }

  return value;
}

/**
 * Returns the play action with the highest estimated card value.
 * Falls back to the first legal play when estimates are unavailable.
 */
function pickBestPlayAction(
  state: GameState,
  playActions: PlayCardAction[],
  playerId: PlayerId,
): GameAction {
  let bestAction: PlayCardAction = playActions[0];
  let bestValue = -Infinity;

  for (const action of playActions) {
    const card = state.players[playerId].hand.find(
      (c) => c.instanceId === action.cardInstanceId,
    );
    if (!card) continue;
    const def = state.cardDefinitions[card.cardId];
    const value = estimateCardValue(card, def);
    if (value > bestValue) {
      bestValue = value;
      bestAction = action;
    }
  }

  return bestAction;
}

/**
 * Decides whether the AI should pass based on board position.
 *
 * Pass conditions (in order):
 *   1. Opponent has already passed AND we are ahead → save cards for next round.
 *   2. We are ahead by ≥10 points → safe to pass regardless.
 *   3. We are ahead by ≥5 points AND hand has ≥4 cards AND ≥3 board units placed
 *      → comfortable position, conserve resources.
 */
function shouldPass(state: GameState, playerId: PlayerId): boolean {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const lead = scores[playerId] - scores[opponentId];
  const opponentHasPassed = state.players[opponentId].hasPassed;
  const myBoardUnits = countBoardUnits(state, playerId);
  const myHandSize = state.players[playerId].hand.length;

  // Rule 1: opponent is done, and we're winning → pass (don't waste cards).
  if (opponentHasPassed && lead > 0) return true;

  // Never pass before placing at least one unit (we'd concede the round for free).
  if (myBoardUnits === 0) return false;

  // Rule 2: very comfortable lead → pass.
  if (lead >= 10) return true;

  // Rule 3: moderate lead with good hand advantage → pass early.
  if (lead >= 5 && myHandSize >= 4 && myBoardUnits >= 3) return true;

  return false;
}

/**
 * Chooses a legal action using a heuristic strategy.
 *
 * Strategy (in priority order):
 *   1. Pass if the board position warrants it (see shouldPass).
 *   2. Otherwise, play the highest-estimated-value card.
 *
 * This ensures the AI conserves resources across rounds instead of
 * dumping its entire hand in round 1.
 */
export function chooseHeuristicAIAction(
  state: GameState,
  playerId: PlayerId,
): GameAction {
  const legal = getLegalActions(state, playerId);

  // Defensive fallback — should never happen during normal play.
  if (legal.length === 0) return { type: "PASS", playerId };

  const playActions = legal.filter(
    (a): a is PlayCardAction => a.type === "PLAY_CARD",
  );

  // No cards to play → must pass.
  if (playActions.length === 0) return { type: "PASS", playerId };

  // Apply pass heuristics before spending a card.
  if (shouldPass(state, playerId)) return { type: "PASS", playerId };

  return pickBestPlayAction(state, playActions, playerId);
}

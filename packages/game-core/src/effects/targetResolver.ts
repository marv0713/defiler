import type { GameState, CardInstance } from "../types";
import type { EffectContext } from "./effectTypes";
import type { TargetSelector } from "./effectTypes";

/**
 * Resolves a TargetSelector to a list of card instances from the game state.
 * Board targets ignore destroyed cards; graveyard targets include them.
 * @param source Where to look for targets: board (default) or graveyard.
 */
export function resolveTargets(
  state: GameState,
  context: EffectContext,
  selector: TargetSelector,
  sourceCardInstanceId?: string,
  source: "board" | "graveyard" = "board",
): CardInstance[] {
  const { sourcePlayerId, opponentPlayerId } = context;
  // Board targets ignore destroyed cards; graveyard targets include them.
  const activeOnly = (cards: CardInstance[]) =>
    source === "graveyard" ? cards : cards.filter((u) => !u.isDestroyed);

  switch (selector.type) {
    case "SELF": {
      if (!sourceCardInstanceId) return [];
      const card = findCardByInstanceId(state, sourceCardInstanceId, source);
      return card && (source === "graveyard" || !card.isDestroyed) ? [card] : [];
    }

    case "ALLY_LOWEST": {
      const units = activeOnly(getCardsFrom(state, sourcePlayerId, source));
      if (units.length === 0) return [];
      const minPower = Math.min(...units.map((u) => u.currentPower));
      return units.filter((u) => u.currentPower === minPower).slice(0, 1);
    }

    case "ALLY_HIGHEST": {
      const units = activeOnly(getCardsFrom(state, sourcePlayerId, source));
      if (units.length === 0) return [];
      const maxPower = Math.max(...units.map((u) => u.currentPower));
      return units.filter((u) => u.currentPower === maxPower).slice(0, 1);
    }

    case "ALLY_RANDOM": {
      const units = activeOnly(getCardsFrom(state, sourcePlayerId, source));
      return pickRandom(units, selector.count, context.random);
    }

    case "ALLY_ROW": {
      return activeOnly(getRowCards(state, sourcePlayerId, selector.row, source));
    }

    case "ENEMY_LOWEST": {
      const units = activeOnly(getCardsFrom(state, opponentPlayerId, source));
      if (units.length === 0) return [];
      const minPower = Math.min(...units.map((u) => u.currentPower));
      return units.filter((u) => u.currentPower === minPower).slice(0, 1);
    }

    case "ENEMY_HIGHEST": {
      const units = activeOnly(getCardsFrom(state, opponentPlayerId, source));
      if (units.length === 0) return [];
      const maxPower = Math.max(...units.map((u) => u.currentPower));
      return units.filter((u) => u.currentPower === maxPower).slice(0, 1);
    }

    case "ENEMY_RANDOM": {
      const units = activeOnly(getCardsFrom(state, opponentPlayerId, source));
      return pickRandom(units, selector.count, context.random);
    }

    case "ENEMY_ROW": {
      return activeOnly(getRowCards(state, opponentPlayerId, selector.row, source));
    }

    case "MANUAL":
      // Manual targets are handled by the action input, not resolved automatically
      return [];

    default:
      return [];
  }
}

/** Gets cards from board or graveyard for a player. */
function getCardsFrom(
  state: GameState,
  playerId: string,
  source: "board" | "graveyard",
): CardInstance[] {
  const player = state.players[playerId as keyof typeof state.players];
  if (!player) return [];

  if (source === "graveyard") {
    return player.graveyard;
  }

  return [...player.board.melee, ...player.board.ranged, ...player.board.siege];
}

/** Gets cards from a specific row in board or graveyard. */
function getRowCards(
  state: GameState,
  playerId: string,
  row: import("../types").Row,
  source: "board" | "graveyard",
): CardInstance[] {
  const player = state.players[playerId as keyof typeof state.players];
  if (!player) return [];

  if (source === "graveyard") {
    // Graveyard cards carry their original row
    return player.graveyard.filter((c) => c.row === row);
  }

  return player.board[row];
}

function findCardByInstanceId(
  state: GameState,
  instanceId: string,
  source: "board" | "graveyard" = "board",
): CardInstance | undefined {
  for (const playerId in state.players) {
    const player = state.players[playerId as keyof typeof state.players];
    const pool =
      source === "graveyard"
        ? player.graveyard
        : [
            ...player.board.melee,
            ...player.board.ranged,
            ...player.board.siege,
            ...player.hand,
            ...player.deck,
            ...player.graveyard,
          ];
    const card = pool.find((c) => c.instanceId === instanceId);
    if (card) return card;
  }
  return undefined;
}

function pickRandom<T>(items: T[], count: number, random: () => number): T[] {
  if (items.length === 0 || count <= 0) return [];
  const result: T[] = [];
  const pool = [...items];
  const actualCount = Math.min(count, pool.length);

  for (let i = 0; i < actualCount; i++) {
    const index = Math.floor(random() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }

  return result;
}

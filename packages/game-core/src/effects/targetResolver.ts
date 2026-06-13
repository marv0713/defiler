import type { GameState, CardInstance } from "../types";
import type { EffectContext } from "./effectTypes";
import type { TargetSelector } from "./effectTypes";

/**
 * Resolves a TargetSelector to a list of card instances from the game state.
 * Automatic targets always ignore destroyed cards.
 */
export function resolveTargets(
  state: GameState,
  context: EffectContext,
  selector: TargetSelector,
  sourceCardInstanceId?: string
): CardInstance[] {
  const { sourcePlayerId, opponentPlayerId } = context;

  switch (selector.type) {
    case "SELF": {
      if (!sourceCardInstanceId) return [];
      const card = findCardByInstanceId(state, sourceCardInstanceId);
      return card && !card.isDestroyed ? [card] : [];
    }

    case "ALLY_LOWEST": {
      const units = getAllUnits(state, sourcePlayerId).filter((u) => !u.isDestroyed);
      if (units.length === 0) return [];
      const minPower = Math.min(...units.map((u) => u.currentPower));
      return units.filter((u) => u.currentPower === minPower);
    }

    case "ALLY_RANDOM": {
      const units = getAllUnits(state, sourcePlayerId).filter((u) => !u.isDestroyed);
      return pickRandom(units, selector.count, context.random);
    }

    case "ALLY_ROW": {
      const player = state.players[sourcePlayerId];
      return player.board[selector.row].filter((u) => !u.isDestroyed);
    }

    case "ENEMY_LOWEST": {
      const units = getAllUnits(state, opponentPlayerId).filter((u) => !u.isDestroyed);
      if (units.length === 0) return [];
      const minPower = Math.min(...units.map((u) => u.currentPower));
      return units.filter((u) => u.currentPower === minPower);
    }

    case "ENEMY_HIGHEST": {
      const units = getAllUnits(state, opponentPlayerId).filter((u) => !u.isDestroyed);
      if (units.length === 0) return [];
      const maxPower = Math.max(...units.map((u) => u.currentPower));
      return units.filter((u) => u.currentPower === maxPower);
    }

    case "ENEMY_RANDOM": {
      const units = getAllUnits(state, opponentPlayerId).filter((u) => !u.isDestroyed);
      return pickRandom(units, selector.count, context.random);
    }

    case "ENEMY_ROW": {
      const opponent = state.players[opponentPlayerId];
      return opponent.board[selector.row].filter((u) => !u.isDestroyed);
    }

    case "MANUAL":
      // Manual targets are handled by the action input, not resolved automatically
      return [];

    default:
      return [];
  }
}

function getAllUnits(state: GameState, playerId: string): CardInstance[] {
  const player = state.players[playerId as keyof typeof state.players];
  if (!player) return [];
  return [...player.board.melee, ...player.board.ranged, ...player.board.siege];
}

function findCardByInstanceId(state: GameState, instanceId: string): CardInstance | undefined {
  for (const playerId in state.players) {
    const player = state.players[playerId as keyof typeof state.players];
    const card = [
      ...player.board.melee,
      ...player.board.ranged,
      ...player.board.siege,
      ...player.hand,
      ...player.deck,
      ...player.graveyard,
    ].find((c) => c.instanceId === instanceId);
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

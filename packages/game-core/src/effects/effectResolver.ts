import type { CardInstance, GameState } from "../types";
import type {
  BuffEffect,
  DamageEffect,
  DestroyEffect,
  DrawDiscardEffect,
  EffectContext,
  EffectDefinition,
  LockEffect,
  ReviveEffect,
  SummonEffect,
  ConditionalBoostEffect,
} from "./effectTypes";
import { resolveTargets } from "./targetResolver";
import { calculateScores } from "../rules/scoring";

/**
 * Applies a list of effects to the game state in order.
 * Returns a new GameState with the effects resolved.
 */
export function resolveEffects(
  state: GameState,
  context: EffectContext,
  effects: EffectDefinition[],
  sourceCardInstanceId?: string,
): GameState {
  let nextState = state;
  let effectIndex = 0;

  for (const effect of effects) {
    nextState = applyEffect(nextState, context, effect, effectIndex, sourceCardInstanceId);
    effectIndex++;
  }

  return nextState;
}

function applyEffect(
  state: GameState,
  context: EffectContext,
  effect: EffectDefinition,
  effectIndex: number,
  sourceCardInstanceId?: string,
): GameState {
  switch (effect.type) {
    case "BUFF":
      return applyBuff(state, context, effect, effectIndex, sourceCardInstanceId);
    case "DAMAGE":
      return applyDamage(state, context, effect, effectIndex, sourceCardInstanceId);
    case "DESTROY":
      return applyDestroy(state, context, effect, sourceCardInstanceId);
    case "SUMMON":
      return applySummon(state, context, effect);
    case "DRAW_DISCARD":
      return applyDrawDiscard(state, context, effect);
    case "REVIVE":
      return applyRevive(state, context, effect);
    case "LOCK":
      return applyLock(state, context, effect, sourceCardInstanceId);
    case "CLEAR_WEATHER":
      return state; // Weather system is not implemented in MVP yet
    case "CONDITIONAL_BOOST":
      return applyConditionalBoost(state, context, effect, effectIndex, sourceCardInstanceId);
    default:
      return state;
  }
}

function applyBuff(
  state: GameState,
  context: EffectContext,
  effect: BuffEffect,
  effectIndex: number,
  sourceCardInstanceId?: string,
): GameState {
  const targets = resolveTargets(state, context, effect.target, sourceCardInstanceId);

  return updateTargets(state, targets, (card) => {
    const modifierId = `buff-${sourceCardInstanceId ?? "unknown"}-e${effectIndex}-${card.instanceId}`;
    return {
      ...card,
      currentPower: card.currentPower + effect.amount,
      modifiers: [
        ...card.modifiers,
        {
          id: modifierId,
          sourceCardInstanceId,
          amount: effect.amount,
          type: "buff" as const,
          expiresAt: "round_end" as const,
        },
      ],
    };
  });
}

function applyDamage(
  state: GameState,
  context: EffectContext,
  effect: DamageEffect,
  effectIndex: number,
  sourceCardInstanceId?: string,
): GameState {
  const targets = resolveTargets(state, context, effect.target, sourceCardInstanceId);

  return updateTargets(state, targets, (card) => {
    const modifierId = `damage-${sourceCardInstanceId ?? "unknown"}-e${effectIndex}-${card.instanceId}`;
    const newPower = Math.max(0, card.currentPower - effect.amount);
    return {
      ...card,
      currentPower: newPower,
      modifiers: [
        ...card.modifiers,
        {
          id: modifierId,
          sourceCardInstanceId,
          amount: -effect.amount,
          type: "damage" as const,
          expiresAt: "round_end" as const,
        },
      ],
    };
  });
}

function applyDestroy(
  state: GameState,
  context: EffectContext,
  effect: DestroyEffect,
  sourceCardInstanceId?: string,
): GameState {
  const targets = resolveTargets(state, context, effect.target, sourceCardInstanceId);

  let nextState = state;

  for (const target of targets) {
    nextState = removeCardFromBoard(nextState, target);
    nextState = addCardToGraveyard(nextState, target);
  }

  return nextState;
}

function applySummon(
  state: GameState,
  context: EffectContext,
  effect: SummonEffect,
): GameState {
  const definition = state.cardDefinitions[effect.cardId];
  if (!definition) return state;

  let nextState = state;

  for (let i = 0; i < effect.count; i++) {
    const player = nextState.players[context.sourcePlayerId];
    const instanceId = `summon-${effect.cardId}-${context.sourcePlayerId}-${nextState.actionLog.length}-${i}`;
    const token: CardInstance = {
      instanceId,
      cardId: effect.cardId,
      ownerId: context.sourcePlayerId,
      type: definition.type,
      row: effect.row,
      currentPower: definition.power,
      basePower: definition.power,
      isLocked: false,
      isDestroyed: false,
      modifiers: [],
    };

    nextState = {
      ...nextState,
      players: {
        ...nextState.players,
        [context.sourcePlayerId]: {
          ...player,
          board: {
            ...player.board,
            [effect.row]: [...player.board[effect.row], token],
          },
        },
      },
    };
  }

  return nextState;
}

/** Replaces each target card in-place across boards, hands, and graveyards. */
function updateTargets(
  state: GameState,
  targets: CardInstance[],
  transform: (card: CardInstance) => CardInstance,
): GameState {
  if (targets.length === 0) return state;

  const targetIds = new Set(targets.map((t) => t.instanceId));
  let nextState = state;

  for (const playerId of ["player", "opponent"] as const) {
    const player = nextState.players[playerId];
    let changed = false;

    const nextBoard = { ...player.board };
    for (const row of ["melee", "ranged", "siege"] as const) {
      const newRow = nextBoard[row].map((card) =>
        targetIds.has(card.instanceId) ? transform(card) : card,
      );
      if (newRow !== nextBoard[row]) {
        nextBoard[row] = newRow;
        changed = true;
      }
    }

    const nextHand = player.hand.map((card) =>
      targetIds.has(card.instanceId) ? transform(card) : card,
    );

    // Also cover graveyard so that effects which target graveyard cards
    // (e.g., a future BUFF that keeps a card buffed after death) are applied correctly.
    const nextGraveyard = player.graveyard.map((card) =>
      targetIds.has(card.instanceId) ? transform(card) : card,
    );

    if (changed || nextHand !== player.hand || nextGraveyard !== player.graveyard) {
      nextState = {
        ...nextState,
        players: {
          ...nextState.players,
          [playerId]: {
            ...player,
            board: nextBoard,
            hand: nextHand,
            graveyard: nextGraveyard,
          },
        },
      };
    }
  }

  return nextState;
}

function removeCardFromBoard(state: GameState, target: CardInstance): GameState {
  for (const playerId of ["player", "opponent"] as const) {
    const player = state.players[playerId];
    for (const row of ["melee", "ranged", "siege"] as const) {
      const index = player.board[row].findIndex((c) => c.instanceId === target.instanceId);
      if (index !== -1) {
        return {
          ...state,
          players: {
            ...state.players,
            [playerId]: {
              ...player,
              board: {
                ...player.board,
                [row]: [
                  ...player.board[row].slice(0, index),
                  ...player.board[row].slice(index + 1),
                ],
              },
            },
          },
        };
      }
    }
  }
  return state;
}

function addCardToGraveyard(state: GameState, target: CardInstance): GameState {
  const ownerId = target.ownerId;
  const player = state.players[ownerId];
  const destroyedCard: CardInstance = { ...target, isDestroyed: true };

  return {
    ...state,
    players: {
      ...state.players,
      [ownerId]: {
        ...player,
        graveyard: [...player.graveyard, destroyedCard],
      },
    },
  };
}

function applyDrawDiscard(
  state: GameState,
  context: EffectContext,
  effect: DrawDiscardEffect,
): GameState {
  const player = state.players[context.sourcePlayerId];
  const drawCount = Math.min(effect.draw, player.deck.length);
  const drawn = player.deck.slice(0, drawCount);
  const remainingDeck = player.deck.slice(drawCount);

  const nextHand = [...player.hand, ...drawn];

  // Discard from end of hand (simple deterministic strategy)
  const discardCount = Math.min(effect.discard, nextHand.length);
  const discarded = nextHand.slice(nextHand.length - discardCount);
  const finalHand = nextHand.slice(0, nextHand.length - discardCount);

  return {
    ...state,
    players: {
      ...state.players,
      [context.sourcePlayerId]: {
        ...player,
        deck: remainingDeck,
        hand: finalHand,
        graveyard: [...player.graveyard, ...discarded.map((c) => ({ ...c, isDestroyed: false }))],
      },
    },
  };
}

function applyRevive(
  state: GameState,
  context: EffectContext,
  effect: ReviveEffect,
): GameState {
  const targets = resolveTargets(state, context, effect.target, undefined, "graveyard");

  // Filter by maxPower if specified (uses basePower so temporary debuffs don't affect eligibility)
  const eligible = effect.maxPower != null
    ? targets.filter((t) => t.basePower <= effect.maxPower!)
    : targets;

  if (eligible.length === 0) return state;

  // Tie-break rule: when multiple cards are eligible (e.g., two cards tied at ALLY_LOWEST),
  // revive the one that entered the graveyard first (lowest array index).
  const toRevive = eligible[0];
  let nextState = removeCardFromGraveyard(state, toRevive);

  const revivedCard: CardInstance = {
    ...toRevive,
    isDestroyed: false,
  };

  const ownerId = toRevive.ownerId;
  const player = nextState.players[ownerId];
  const row = revivedCard.row ?? "melee";

  return {
    ...nextState,
    players: {
      ...nextState.players,
      [ownerId]: {
        ...player,
        board: {
          ...player.board,
          [row]: [...player.board[row], revivedCard],
        },
      },
    },
  };
}

function applyLock(
  state: GameState,
  context: EffectContext,
  effect: LockEffect,
  sourceCardInstanceId?: string,
): GameState {
  const targets = resolveTargets(state, context, effect.target, sourceCardInstanceId, "board");

  return updateTargets(state, targets, (card) => ({
    ...card,
    isLocked: true,
  }));
}

function applyConditionalBoost(
  state: GameState,
  context: EffectContext,
  effect: ConditionalBoostEffect,
  effectIndex: number,
  sourceCardInstanceId?: string,
): GameState {
  if (!sourceCardInstanceId || !conditionMatches(state, context, effect.condition, sourceCardInstanceId)) {
    return state;
  }

  return applyBuff(
    state,
    context,
    {
      type: "BUFF",
      target: { type: "SELF" },
      amount: effect.amount,
    },
    effectIndex,
    sourceCardInstanceId,
  );
}

function conditionMatches(
  state: GameState,
  context: EffectContext,
  condition: ConditionalBoostEffect["condition"],
  sourceCardInstanceId?: string,
): boolean {
  const scores = calculateScores(state);
  let sourceScore = scores[context.sourcePlayerId];
  const opponentScore = scores[context.opponentPlayerId];

  // If we are checking scores, subtract the source card's power to get the score before it was played
  if (sourceCardInstanceId) {
    const board = state.players[context.sourcePlayerId].board;
    const card = [...board.melee, ...board.ranged, ...board.siege].find(
      (c) => c.instanceId === sourceCardInstanceId,
    );
    if (card) {
      sourceScore -= card.currentPower;
    }
  }

  switch (condition.type) {
    case "SCORE_AHEAD":
      return sourceScore > opponentScore;
    case "SCORE_BEHIND":
      return sourceScore < opponentScore;
    case "OPPONENT_PASSED":
      return state.players[context.opponentPlayerId].hasPassed;
    case "ALLY_UNIT_COUNT_AT_LEAST":
      return countActiveBoardUnits(state, context.sourcePlayerId) >= condition.count;
  }
}

function countActiveBoardUnits(state: GameState, playerId: "player" | "opponent"): number {
  const board = state.players[playerId].board;
  return [...board.melee, ...board.ranged, ...board.siege].filter(
    (card) => !card.isDestroyed,
  ).length;
}

function removeCardFromGraveyard(state: GameState, target: CardInstance): GameState {
  const ownerId = target.ownerId;
  const player = state.players[ownerId];
  const index = player.graveyard.findIndex((c) => c.instanceId === target.instanceId);
  if (index === -1) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [ownerId]: {
        ...player,
        graveyard: [
          ...player.graveyard.slice(0, index),
          ...player.graveyard.slice(index + 1),
        ],
      },
    },
  };
}

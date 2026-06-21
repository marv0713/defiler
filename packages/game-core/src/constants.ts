import type { Faction, Row } from "./types";

export const ROWS = ["melee", "ranged", "siege"] as const satisfies readonly Row[];

export const FACTIONS = [
  "qin",
  "chu",
  "qi",
  "zhao",
  "neutral",
] as const satisfies readonly Faction[];

export const STARTING_HAND_SIZE = 10;

export const MAX_ROUND_WINS = 2;

/** Standard deck size (Gwent-style). Both Quick Battle and Campaign use this. */
export const DECK_SIZE = 25;

/**
 * Cards drawn from deck at the start of each round (Gwent original rules).
 * Round 1: no draw (players start with their opening hand).
 * Round 2: +2 cards. Round 3: +1 card.
 */
export const ROUND_DRAW_COUNTS: Partial<Record<number, number>> = { 2: 2, 3: 1 };

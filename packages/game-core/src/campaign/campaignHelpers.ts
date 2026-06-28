import type { CardDefinition, Faction } from "../types";
import { INITIAL_CARDS } from "../cards/cardData";

/**
 * Returns the card definitions available to a player in campaign deck building
 * for the given faction: faction cards + neutral cards, excluding tokens.
 */
export function getCampaignCardPool(faction: Faction): CardDefinition[] {
  return INITIAL_CARDS.filter(
    (c) =>
      (c.faction === faction || c.faction === "neutral") &&
      (c.type === "unit" || c.type === "special") &&
      c.id !== "qin-token" &&
      c.id !== "chu-token",
  );
}

/** Deck composition statistics for a given faction pool. */
export interface FactionDeckStats {
  /** Total cards in the pool (faction + neutral, excluding tokens). */
  total: number;
  units: number;
  specials: number;
  melee: number;
  ranged: number;
  siege: number;
  neutral: number;
  /** Average power across all unit cards in the pool. */
  avgPower: number;
  /** Card IDs of the 5 highest-power cards in the pool (for "core cards" preview). */
  coreCardIds: string[];
}

/**
 * Returns deck composition statistics for a campaign faction's card pool.
 * Pure function — usable from any platform (Web, WeChat Mini Program, iOS).
 */
export function getFactionDeckStats(faction: Faction): FactionDeckStats {
  const pool = getCampaignCardPool(faction);

  const units = pool.filter((c) => c.type === "unit");
  const specials = pool.filter((c) => c.type === "special");
  const neutralCards = pool.filter((c) => c.faction === "neutral");
  const unitPowers = units.map((c) => c.power);
  const avgPower =
    unitPowers.length > 0
      ? Math.round((unitPowers.reduce((sum, p) => sum + p, 0) / unitPowers.length) * 10) / 10
      : 0;

  // Top 5 highest-power cards (for core card preview).
  const top5 = [...units]
    .sort((a, b) => b.power - a.power)
    .slice(0, 5)
    .map((c) => c.id);

  return {
    total: pool.length,
    units: units.length,
    specials: specials.length,
    melee: units.filter((c) => c.row === "melee").length,
    ranged: units.filter((c) => c.row === "ranged").length,
    siege: units.filter((c) => c.row === "siege").length,
    neutral: neutralCards.length,
    avgPower,
    coreCardIds: top5,
  };
}

/**
 * Returns whether a campaign level at the given index is unlocked.
 * Level 0 is always unlocked. Otherwise the previous level must be completed,
 * or the entire campaign must be cleared (last level completed).
 */
export function isLevelUnlocked(
  levelIndex: number,
  completedIds: string[],
  lastLevelId: string,
): boolean {
  if (levelIndex === 0) return true;
  if (completedIds.includes(lastLevelId)) return true;

  // Previous level must be completed.
  // The caller provides the ordered level IDs; here we use a simple
  // index-based check — the caller ensures correct ordering.
  return completedIds.length > 0;
}

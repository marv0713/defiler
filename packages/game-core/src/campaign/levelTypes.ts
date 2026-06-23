import type { Faction } from "../types";

/** Constraint on the player's deck when entering a level. */
export interface DeckConstraint {
  /** Whether the same card ID may appear more than once. Default: true. */
  allowDuplicates: boolean;
  /** If set, the player's deck must include at least one card from each listed faction. */
  requiredFactions?: Faction[];
  /** If set, the player's deck must draw cards from at least this many distinct factions. */
  minFactions?: number;
}

/**
 * Victory condition for a level.
 *
 * - "standard"       — player must win the match (2-out-of-3 rounds).
 * - "must_win_round2" — player must win round 2 specifically (in addition to
 *                       winning the match overall).  Used to teach comeback
 *                       mechanics: the opponent intentionally concedes round 1.
 */
export type WinCondition =
  | { type: "standard" }
  | { type: "must_win_round2" };

export interface LevelDefinition {
  /** Unique stable identifier used as the save-store key. */
  id: string;
  /** Short display title (bilingual, e.g. "铁壁 · Iron Wall"). */
  title: string;
  /** i18n key for the one-line subtitle shown on the level card. */
  subtitleTextId: string;
  /** Difficulty 1 (easiest) → 5 (hardest). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  opponentFaction: Faction;
  /**
   * Hand-crafted 25-card opponent deck (card IDs, duplicates allowed).
   * These IDs are resolved against INITIAL_CARDS at game-start time.
   */
  opponentDeck: string[];
  deckConstraint: DeckConstraint;
  winCondition: WinCondition;
  /** i18n key for the brief strategy hint shown in the Deck Builder. */
  hintTextId: string;
}

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

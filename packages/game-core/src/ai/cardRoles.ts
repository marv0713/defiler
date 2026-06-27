import type { CardDefinition } from "../types";

export type CardRole =
  | "filler"
  | "tempo"
  | "removal"
  | "row_buff"
  | "setup"
  | "finisher"
  | "resource";

export function classifyCardRoles(definition: CardDefinition): Set<CardRole> {
  const roles = new Set<CardRole>();

  if (definition.power >= 7) {
    roles.add("tempo");
  }
  if (definition.rarity === "hero" || definition.rarity === "legend") {
    roles.add("finisher");
  }

  for (const effect of definition.effects) {
    if (
      effect.type === "DAMAGE" ||
      effect.type === "DESTROY" ||
      effect.type === "LOCK"
    ) {
      roles.add("removal");
    }
    if (effect.type === "BUFF" && effect.target.type === "ALLY_ROW") {
      roles.add("row_buff");
    }
    if (effect.type === "SUMMON") {
      roles.add("setup");
    }
    if (effect.type === "DRAW_DISCARD" || effect.type === "REVIVE") {
      roles.add("resource");
    }
    if (effect.type === "CONDITIONAL_BOOST") {
      roles.add("finisher");
    }
  }

  if (roles.size === 0) {
    roles.add("filler");
  }
  return roles;
}

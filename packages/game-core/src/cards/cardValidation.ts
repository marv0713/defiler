import { FACTIONS, ROWS } from "../constants";
import { EFFECT_TYPES } from "../effects/effectTypes";
import type { CardDefinition } from "../types";

const VALID_EFFECT_TYPES = new Set<string>(EFFECT_TYPES);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function isKnownFaction(faction: string): boolean {
  return FACTIONS.some((knownFaction) => knownFaction === faction);
}

function isKnownRow(row: string): boolean {
  return ROWS.some((knownRow) => knownRow === row);
}

export function validateCards(cards: CardDefinition[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenCardIds = new Set<string>();

  for (const card of cards) {
    if (seenCardIds.has(card.id)) {
      errors.push(`Duplicate card id: ${card.id}`);
    }
    seenCardIds.add(card.id);

    if (card.type === "unit" && !card.row) {
      errors.push(`Unit card missing row: ${card.id}`);
    }

    if (card.power < 0) {
      errors.push(`Card has negative power: ${card.id}`);
    }

    if (!isKnownFaction(card.faction)) {
      errors.push(`Card has unknown faction: ${card.id}`);
    }

    if (card.row && !isKnownRow(card.row)) {
      errors.push(`Card has unknown row: ${card.id}`);
    }

    for (const effect of card.effects) {
      if (!VALID_EFFECT_TYPES.has(effect.type)) {
        errors.push(`Card has unknown effect type ${effect.type}: ${card.id}`);
      }
    }

    if (card.budget === undefined) {
      warnings.push(`Card missing budget: ${card.id}`);
    }

    if (card.description.trim().length === 0) {
      warnings.push(`Card missing description: ${card.id}`);
    }

    if (!card.nameTextId) {
      warnings.push(`Card missing nameTextId: ${card.id}`);
    }

    if (!card.descriptionTextId) {
      warnings.push(`Card missing descriptionTextId: ${card.id}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

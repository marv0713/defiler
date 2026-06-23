import { enMessages } from "./messages.en";
import { zhMessages } from "./messages.zh";
import type { Language, TranslationParams } from "./types";
import type { CardDefinition } from "@warring-states/game-core";

const messages = {
  en: enMessages,
  zh: zhMessages,
} satisfies Record<Language, Record<string, string>>;

function interpolate(template: string, params: TranslationParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

export function translate(
  language: Language,
  id: string,
  params?: TranslationParams,
): string {
  const template = messages[language][id] ?? messages.en[id] ?? id;
  return interpolate(template, params);
}

export function getCardName(
  t: (id: string) => string,
  definition: CardDefinition | undefined,
  fallbackCardId: string,
): string {
  if (definition?.nameTextId) return t(definition.nameTextId);
  return definition?.englishName ?? fallbackCardId.replace(/-/g, " ");
}

export function getCardDescription(
  t: (id: string) => string,
  definition: CardDefinition | undefined,
): string {
  if (definition?.descriptionTextId) return t(definition.descriptionTextId);
  return definition?.description ?? "";
}

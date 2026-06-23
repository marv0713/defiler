# Internationalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multilingual text support where every user-facing string has a stable text id and translations are stored in language-specific configuration.

**Architecture:** Keep `packages/game-core` independent from React, browser APIs, and app-level i18n runtime. `game-core` may expose stable text ids on data objects, while `apps/web` owns translation dictionaries, language selection, interpolation, persistence, and rendering.

**Tech Stack:** React + TypeScript + Vite, Zustand for app state, Vitest for i18n and integration tests, lightweight in-repo i18n utilities instead of a large external i18n library for MVP.

---

## Scope

This plan introduces multilingual support for:

- Static UI text: buttons, headings, labels, status text.
- Dynamic UI text: action labels, round results, variable interpolation.
- Card content: card names and descriptions.
- Domain labels: factions, rows, rarity/effect labels.

This plan does not include:

- Server-side locale detection.
- Online translation services.
- RTL layout.
- Pluralization libraries beyond simple MVP helpers.
- External language file loading from a CMS.

## Design Principles

1. Every player-visible text should have a stable id.
2. Translation dictionaries live in `apps/web` for the MVP.
3. `packages/game-core` can store text ids but must not import React, Zustand, browser APIs, or app i18n helpers.
4. Card behavior remains config-driven; do not hardcode one translation function per card.
5. Missing translations should fail tests for required dictionaries.
6. Runtime fallback should be safe: show English or the text id instead of crashing.
7. Dynamic text must use interpolation, not string concatenation in components.

## Text Id Convention

Use dot-separated ids grouped by feature:

```text
app.title
start.subtitle
start.quickBattle
start.campaign
game.round
game.roundOver
game.yourTurn
game.opponentTurn
game.passRound
result.victory
result.defeat
faction.qin.name
row.melee.name
card.qin-infantry.name
card.qin-infantry.description
log.playerPlaysCard
```

Rules:

- Use card ids directly inside card text ids: `card.<cardId>.name`.
- Use existing stable domain ids for factions, rows, effects, and rarities.
- Do not include language codes in ids.
- Do not use visual emoji as part of text ids.

## Target File Structure

```text
apps/web/src/i18n/
  types.ts
  messages.en.ts
  messages.zh.ts
  i18n.ts
  I18nProvider.tsx
  i18n.test.ts

apps/web/src/store/
  settingsStore.ts

packages/game-core/src/
  types.ts
  cards/cardData.ts
```

Optional later split:

```text
apps/web/src/i18n/cardMessages.en.ts
apps/web/src/i18n/cardMessages.zh.ts
apps/web/src/i18n/uiMessages.en.ts
apps/web/src/i18n/uiMessages.zh.ts
```

Start with single `messages.<lang>.ts` files to keep the first pass simple.

## Public API

```ts
export type Language = "en" | "zh";

export type TextId = string;

export type TranslationParams = Record<string, string | number>;

export function translate(
  language: Language,
  id: TextId,
  params?: TranslationParams,
): string;
```

React hook:

```ts
export function useI18n(): {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (id: TextId, params?: TranslationParams) => string;
};
```

Example usage:

```tsx
const { t } = useI18n();

<button>{t("start.quickBattle")}</button>
<span>{t("game.round", { round: gameState.currentRound })}</span>
```

## Card Data Strategy

Current card data:

```ts
export interface CardDefinition {
  id: string;
  name: string;
  englishName: string;
  description: string;
}
```

Target card data:

```ts
export interface CardDefinition {
  id: string;
  name: string;
  englishName: string;
  nameTextId?: string;
  descriptionTextId?: string;
  description: string;
}
```

Keep `name`, `englishName`, and `description` during migration for compatibility.
Add `nameTextId` and `descriptionTextId` first, then gradually update rendering to
prefer translations:

```ts
const displayName = def?.nameTextId
  ? t(def.nameTextId)
  : def?.englishName ?? fallbackName;
```

This avoids a risky all-at-once card-data rewrite.

## Dynamic Text Strategy

Use interpolation:

```ts
t("log.opponentPlaysCard", { card: t(cardNameId) })
```

Dictionary entry:

```ts
"log.opponentPlaysCard": "Opponent plays {card}"
```

Chinese:

```ts
"log.opponentPlaysCard": "对手打出了{card}"
```

MVP interpolation rules:

- Replace `{key}` with `String(params[key])`.
- If a key is missing, leave `{key}` visible so tests and manual QA catch it.
- Do not support nested formatting in the first pass.

## Task 1: Add Core I18n Runtime

**Files:**

- Create: `apps/web/src/i18n/types.ts`
- Create: `apps/web/src/i18n/messages.en.ts`
- Create: `apps/web/src/i18n/messages.zh.ts`
- Create: `apps/web/src/i18n/i18n.ts`
- Create: `apps/web/src/i18n/i18n.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/i18n/i18n.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { translate } from "./i18n";

describe("translate", () => {
  test("returns a translation by id and language", () => {
    expect(translate("en", "start.quickBattle")).toBe("Quick Battle");
    expect(translate("zh", "start.quickBattle")).toBe("快速战斗");
  });

  test("interpolates variables", () => {
    expect(translate("en", "game.round", { round: 2 })).toBe("Round 2 / 3");
    expect(translate("zh", "game.round", { round: 2 })).toBe("第 2 / 3 回合");
  });

  test("falls back to English when language entry is missing", () => {
    expect(translate("zh", "debug.missingInZh")).toBe("Debug fallback");
  });

  test("falls back to id when all entries are missing", () => {
    expect(translate("en", "missing.id")).toBe("missing.id");
  });
});
```

- [ ] **Step 2: Run red test**

Run:

```bash
pnpm --filter @warring-states/web test -- src/i18n/i18n.test.ts
```

Expected: fail because `./i18n` does not exist.

- [ ] **Step 3: Add types**

Create `apps/web/src/i18n/types.ts`:

```ts
export type Language = "en" | "zh";

export type TextId = string;

export type TranslationParams = Record<string, string | number>;

export type MessageDictionary = Record<TextId, string>;
```

- [ ] **Step 4: Add English messages**

Create `apps/web/src/i18n/messages.en.ts`:

```ts
import type { MessageDictionary } from "./types";

export const enMessages: MessageDictionary = {
  "app.eyebrow": "Warring States · Card Tactics",
  "app.title": "Warring States",
  "start.subtitle": "Choose your faction and battle the AI across three rounds. Score the most points to conquer each round — win two to claim victory.",
  "start.yourFaction": "Your Faction",
  "start.opponentFaction": "Opponent (AI)",
  "start.quickBattle": "Quick Battle",
  "start.campaign": "Campaign",
  "game.round": "Round {round} / 3",
  "game.roundOver": "Round Over",
  "game.gameStarted": "Game started",
  "game.yourTurn": "Your turn — choose a card or pass",
  "game.opponentTurn": "Opponent's turn…",
  "game.playerPassed": "You passed — waiting for opponent…",
  "game.roundOverStatus": "Round Over — see result below",
  "game.passRound": "Pass Round",
  "debug.missingInZh": "Debug fallback",
};
```

- [ ] **Step 5: Add Chinese messages**

Create `apps/web/src/i18n/messages.zh.ts`:

```ts
import type { MessageDictionary } from "./types";

export const zhMessages: MessageDictionary = {
  "app.eyebrow": "战国 · 卡牌策略",
  "app.title": "战国牌策",
  "start.subtitle": "选择阵营，与 AI 进行三轮对战。每轮总战力更高的一方获胜，先赢两轮即可取胜。",
  "start.yourFaction": "你的阵营",
  "start.opponentFaction": "对手（AI）",
  "start.quickBattle": "快速战斗",
  "start.campaign": "战役",
  "game.round": "第 {round} / 3 回合",
  "game.roundOver": "回合结束",
  "game.gameStarted": "游戏开始",
  "game.yourTurn": "轮到你了：打出一张牌或选择放弃本轮",
  "game.opponentTurn": "对手行动中…",
  "game.playerPassed": "你已放弃本轮，等待对手行动…",
  "game.roundOverStatus": "回合结束，查看结果",
  "game.passRound": "放弃本轮",
};
```

- [ ] **Step 6: Add translation function**

Create `apps/web/src/i18n/i18n.ts`:

```ts
import { enMessages } from "./messages.en";
import { zhMessages } from "./messages.zh";
import type { Language, TranslationParams } from "./types";

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
```

- [ ] **Step 7: Run green test**

Run:

```bash
pnpm --filter @warring-states/web test -- src/i18n/i18n.test.ts
```

Expected: pass.

## Task 2: Add Language State And Hook

**Files:**

- Create: `apps/web/src/store/settingsStore.ts`
- Create: `apps/web/src/i18n/I18nProvider.tsx`
- Modify: `apps/web/src/main.tsx`
- Test: `apps/web/src/i18n/i18n.test.ts`

- [ ] **Step 1: Add settings store**

Create `apps/web/src/store/settingsStore.ts`:

```ts
import { create } from "zustand";
import type { Language } from "../i18n/types";

interface SettingsStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

const STORAGE_KEY = "warring-states-language";

function readInitialLanguage(): Language {
  if (typeof localStorage === "undefined") return "en";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "zh" || saved === "en" ? saved : "en";
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: readInitialLanguage(),
  setLanguage(language) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language);
    }
    set({ language });
  },
}));
```

- [ ] **Step 2: Add hook provider file**

Create `apps/web/src/i18n/I18nProvider.tsx`:

```tsx
import { createContext, useContext, useMemo } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { translate } from "./i18n";
import type { Language, TranslationParams } from "./types";

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (id: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (id, params) => translate(language, id, params),
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
```

- [ ] **Step 3: Wrap app**

Modify `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./i18n/I18nProvider";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
```

- [ ] **Step 4: Add language switcher acceptance**

Add language switcher in `StartScreen` during Task 3, after `useI18n` is available.

## Task 3: Replace Static UI Text

**Files:**

- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/HandView.tsx`
- Modify: `apps/web/src/components/PlayerBoard.tsx`
- Modify: `apps/web/src/components/CardView.tsx`
- Modify: `apps/web/src/i18n/messages.en.ts`
- Modify: `apps/web/src/i18n/messages.zh.ts`
- Test: `apps/web/src/store/gameStore.test.ts`

- [ ] **Step 1: Add required message ids**

Add at least these ids:

```ts
"common.vs": "VS",
"common.pointsShort": "{score}pt",
"common.winCount": "{count} win{suffix}",
"player.you": "You",
"player.opponent": "Opponent",
"board.hand": "Hand: {count}",
"board.deck": "Deck: {count}",
"board.passed": "PASSED",
"row.melee": "Melee",
"row.ranged": "Ranged",
"row.siege": "Siege",
"hand.empty": "— no cards in hand —",
"hand.playCardLabel": "Play {card}, power {power}{rowText}",
"hand.rowText": ", row: {row}",
"round.title": "Round {round} Over",
"round.playerWon": "You won the round!",
"round.opponentWon": "Opponent won the round.",
"round.draw": "Round drawn — no wins awarded.",
"round.startNext": "Start Round {round}",
"result.victory": "Victory",
"result.defeat": "Defeat",
```

Add Chinese equivalents in `messages.zh.ts`.

- [ ] **Step 2: Use `useI18n` in `App.tsx`**

Replace static strings in `StartScreen`, `RoundResultBanner`, `GameScreen`, and
`ResultScreen` with `t(id)`.

Example:

```tsx
const { t, language, setLanguage } = useI18n();

<p className="eyebrow">{t("app.eyebrow")}</p>
<h1>{t("app.title")}</h1>
<p className="subtitle">{t("start.subtitle")}</p>

<button onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
  {language === "en" ? "中文" : "English"}
</button>
```

- [ ] **Step 3: Pass `t` into leaf components**

Prefer passing resolved labels or `t` as a prop to avoid every leaf component
subscribing to language state. For MVP, either is acceptable. Recommended:

```tsx
<PlayerBoard
  player={player}
  label={t("player.you")}
  labels={{
    hand: t("board.hand", { count: player.hand.length }),
    deck: t("board.deck", { count: player.deck.length }),
    passed: t("board.passed"),
  }}
/>
```

- [ ] **Step 4: Update tests**

Run:

```bash
pnpm --filter @warring-states/web test
```

Expected: existing store tests pass; component text is not directly tested yet.

## Task 4: Add Card Text Ids

**Files:**

- Modify: `packages/game-core/src/types.ts`
- Modify: `packages/game-core/src/cards/cardData.ts`
- Modify: `packages/game-core/src/cards/cardValidation.ts`
- Modify: `packages/game-core/src/cards/cardData.test.ts`
- Modify: `apps/web/src/i18n/messages.en.ts`
- Modify: `apps/web/src/i18n/messages.zh.ts`

- [ ] **Step 1: Extend card type**

Modify `CardDefinition`:

```ts
export interface CardDefinition {
  id: string;
  name: string;
  englishName: string;
  nameTextId?: string;
  descriptionTextId?: string;
  faction: Faction;
  type: CardType;
  row?: Row;
  power: number;
  rarity: Rarity;
  tags: string[];
  effects: EffectDefinition[];
  budget?: number;
  description: string;
}
```

- [ ] **Step 2: Add text ids to card data**

For each card:

```ts
{
  id: "qin-infantry",
  name: "Qin Infantry",
  englishName: "Qin Infantry",
  nameTextId: "card.qin-infantry.name",
  descriptionTextId: "card.qin-infantry.description",
  ...
}
```

- [ ] **Step 3: Add validation**

In `cardValidation.ts`, add warnings when text ids are missing:

```ts
if (!card.nameTextId) {
  warnings.push(`Card missing nameTextId: ${card.id}`);
}

if (!card.descriptionTextId) {
  warnings.push(`Card missing descriptionTextId: ${card.id}`);
}
```

Do not make these errors until all card data has been migrated.

- [ ] **Step 4: Add dictionary entries**

For English, mirror current card text:

```ts
"card.qin-infantry.name": "Qin Infantry",
"card.qin-infantry.description": "A dependable Qin melee unit with straightforward power.",
```

For Chinese, use best available translation. If a final localized name is not
ready, use the existing `name` field or a clear temporary Chinese label.

- [ ] **Step 5: Add tests**

Add a test in `cardData.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { INITIAL_CARDS } from "./cardData";

describe("card text ids", () => {
  test("each card has stable text ids", () => {
    for (const card of INITIAL_CARDS) {
      expect(card.nameTextId).toBe(`card.${card.id}.name`);
      expect(card.descriptionTextId).toBe(`card.${card.id}.description`);
    }
  });
});
```

## Task 5: Render Localized Card Text

**Files:**

- Modify: `apps/web/src/components/CardView.tsx`
- Modify: `apps/web/src/components/HandView.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Add card translation helper**

Create inside `apps/web/src/i18n/i18n.ts` or a small helper file:

```ts
import type { CardDefinition } from "@warring-states/game-core";

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
```

- [ ] **Step 2: Use helper in `CardView` and `HandView`**

Pass `t` or resolved text into both components. Tooltips should use localized
name and localized description:

```tsx
const displayName = getCardName(t, definition, card.cardId);
const description = getCardDescription(t, definition);
const tooltip = description ? `${displayName}\n${description}` : displayName;
```

## Task 6: Localize Store Action Labels

**Files:**

- Modify: `apps/web/src/store/gameStore.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/i18n/messages.en.ts`
- Modify: `apps/web/src/i18n/messages.zh.ts`

Current store writes English labels like:

```ts
"Your turn — play a card or pass."
"Opponent plays ..."
"You pass"
```

Recommended design:

```ts
interface LastActionMessage {
  id: string;
  params?: Record<string, string | number>;
}
```

Then UI renders:

```tsx
const lastActionText = lastAction
  ? t(lastAction.id, lastAction.params)
  : t("game.gameStarted");
```

Migration path:

1. Add `lastActionMessage` alongside existing `lastAction`.
2. Render `lastActionMessage` when present, fallback to `lastAction`.
3. Remove string-only `lastAction` after tests are updated.

Useful ids:

```ts
"log.gameStarted": "Game started",
"log.yourTurn": "Your turn — play a card or pass.",
"log.playerPlaysCard": "You play {card}{effects}",
"log.opponentPlaysCard": "Opponent plays {card}{effects}",
"log.playerPasses": "You pass",
"log.opponentPasses": "Opponent passes",
"log.effectSuffix": " [{effects}]",
```

## Task 7: Validation And CI

**Files:**

- Create: `apps/web/src/i18n/messages.test.ts`
- Modify: `package.json` only if a new script is desired.

- [ ] **Step 1: Test dictionary parity**

Create `apps/web/src/i18n/messages.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { enMessages } from "./messages.en";
import { zhMessages } from "./messages.zh";

describe("translation dictionaries", () => {
  test("Chinese dictionary has every English key", () => {
    const missing = Object.keys(enMessages).filter((key) => !(key in zhMessages));
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 2: Test card text ids exist in dictionaries**

Add:

```ts
import { INITIAL_CARDS } from "@warring-states/game-core";

test("card text ids exist in all dictionaries", () => {
  for (const card of INITIAL_CARDS) {
    expect(enMessages[card.nameTextId!]).toBeTruthy();
    expect(enMessages[card.descriptionTextId!]).toBeTruthy();
    expect(zhMessages[card.nameTextId!]).toBeTruthy();
    expect(zhMessages[card.descriptionTextId!]).toBeTruthy();
  }
});
```

- [ ] **Step 3: Run full validation**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: all pass.

## Rollout Recommendation

Implement in this order:

1. Runtime translator and dictionaries.
2. UI static text.
3. Language switcher and persistence.
4. Card text ids and card dictionary entries.
5. Localized card rendering.
6. Dynamic store/log messages.
7. Translation parity tests.

This order keeps the first visible win small while avoiding a risky card-data
rewrite before the UI translation path is proven.

## Acceptance Criteria

- User can switch between English and Chinese in the web UI.
- Language preference persists after reload.
- Static UI strings use `t(id)`.
- Card names and descriptions render through text ids.
- Dynamic action text uses interpolation.
- `packages/game-core` has no React/browser/i18n runtime dependency.
- Missing translation ids do not crash the app.
- Tests cover translation lookup, interpolation, dictionary parity, and card text ids.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` pass.

## Open Decisions

- Whether Chinese should be Simplified only (`zh`) or split later into
  `zh-Hans` / `zh-Hant`.
- Whether card translation entries should remain in web dictionaries or move to
  data files generated from card data.
- Whether English remains the fallback language for all locales.
- Whether future narrative/campaign content should live in separate translation
  files to keep dictionaries smaller.

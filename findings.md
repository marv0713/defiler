# Findings

## Project Structure

- The project is a pnpm workspace with:
  - `apps/web`: React + TypeScript + Vite UI.
  - `packages/game-core`: pure TypeScript game logic package.
- There is currently no traditional backend service. Game logic lives in `packages/game-core` and is consumed locally by the web app.
- `docs/tasks.md` is a long-term roadmap, not a good session recovery log. The root files `task_plan.md`, `progress.md`, and `findings.md` now act as persistent working memory.

## Technical Notes

- `packages/game-core` must stay independent from React and browser APIs.
- The game state types are JSON-friendly and intended for debugging, save files, replay, and simulation.
- Vitest runs through Vite transform and does not fully typecheck all type-only contracts by itself.
- The package build tsconfig excludes test files, so explicit `tsc --noEmit` can be useful when checking test-only type contracts.
- Seeded randomness is implemented in `packages/game-core/src/utils/random.ts`; future game-core rules should use it instead of `Math.random`.
- Game initialization uses seed-derived shuffle seeds: `${seed}-player` and `${seed}-opponent`.
- Runtime card instance ids currently use `${ownerId}-${card.id}-${index}` so duplicate card definitions in a deck still get distinct instances by source index.
- `ActionTarget` is currently a small union for row, card instance, or player targets. It intentionally does not include reducer behavior yet.
- Legal action generation needs runtime card instances to expose enough card metadata to distinguish unit cards from special/weather cards. The minimum useful metadata is `type` and optional `row`.
- Reducer currently validates PLAY_CARD and PASS through `getLegalActions`.
- `START_NEXT_ROUND` is allowed through reducer only when `state.status === "round_finished"`.
- `RESTART_GAME` remains typed but intentionally unimplemented until a later UI/store task needs restart config.
- Tie rounds currently produce no `roundWinnerId` and no round-win increment during normal play.
- Round-3 draw tiebreaker in `round.ts` (see "MVP Temporary Rules" below) now awards the match to the player with more `roundWins`; only when round wins are also tied does the opponent win as a termination fallback.
- Next round first player is the previous `roundWinnerId`; ties keep the previous `currentPlayerId`.

## Current Design Decisions

- Keep `docs/tasks.md` unchanged as the canonical task roadmap.
- Use `task_plan.md` for active task status and next-step recovery.
- Use `progress.md` for completed actions and verification results.
- Use `findings.md` for design decisions, surprises, and implementation notes that should survive context loss.

## Project Agent Rules

- `AGENTS.md` is the project rule file. Earlier notes referred to `agent.md`, which has since been replaced by the standard uppercase filename.
- It reinforces that game rules must stay out of React components and `packages/game-core` must remain independent from React/browser APIs.
- Gameplay changes require Vitest tests.
- Online multiplayer, payments, drag-and-drop, and animations are out of scope unless explicitly requested.
- Card behavior should remain config-driven; do not hardcode one function per card.
- The file lists `npm test` and `npm run build`, but this pnpm workspace currently verifies with `pnpm test`, `pnpm typecheck`, and `pnpm build`.

## Card Data

- `INITIAL_CARDS` lives in `packages/game-core/src/cards/cardData.ts`.
- Task 3.1 intentionally uses empty `effects: []` for all initial cards. Effect configs will become strict and behavior-bearing in later Phase 3 tasks.
- Special cards currently use `power: 0` because `CardDefinition.power` is required and the scoring rules only count board units.
- The initial pool contains exactly 20 cards: 5 each for Qin, Chu, Qi, and Zhao.

## Card Validation

- `validateCards` lives in `packages/game-core/src/cards/cardValidation.ts`.
- Validation returns `{ valid, errors, warnings }`.
- `valid` is based only on errors; warnings do not fail validation.
- Validation checks effect type names against `EFFECT_TYPES` from `packages/game-core/src/effects/effectTypes.ts`.
- Tests that intentionally model invalid external card data should cast through `unknown` before `CardDefinition` types, because normal TypeScript code is now protected by strict effect types.

## Effect Types

- Formal effect types live in `packages/game-core/src/effects/effectTypes.ts`.
- `CardDefinition.effects` now uses the `EffectDefinition` union instead of a loose `{ type: string }` placeholder.
- `EffectContext` currently carries `sourcePlayerId`, `opponentPlayerId`, and deterministic `random`.
- Task 3.3 defines types only; target resolution and effect execution remain for later Phase 3 tasks.

## Effect Resolver

- `resolveEffects` lives in `packages/game-core/src/effects/effectResolver.ts`.
- It is a pure function: `(state, context, effects, sourceCardInstanceId?) => GameState`.
- Effects are applied in order; each effect produces a new state, feeding into the next.
- Modifier IDs use the pattern `{type}-{sourceCardInstanceId}-e{effectIndex}-{targetInstanceId}` for full determinism.
- `cardDefinitions` was added to `GameState` so SUMMON can resolve card definitions at runtime without coupling to any static registry.
- `EffectContext.random` is derived from `${state.seed}-fx-${state.actionLog.length}` in the reducer, making every action's random sequence reproducible.
- `updateTargets` covers boards, hands, **and graveyards** for all three players — graveyard support was added in the 3.4-3.6 fix pass.
- DESTROY is a two-step: `removeCardFromBoard` then `addCardToGraveyard` (with `isDestroyed: true`).
- DRAW_DISCARD discards from the end of the hand deterministically; discarded cards are placed in the graveyard with `isDestroyed: false` (they were not destroyed in combat, so they can be REVIVE targets).
- DRAW_DISCARD caveat: drawn cards are appended to the hand, and discard slices from the *end*, so a `draw:2 discard:1` effect will always discard one of the freshly-drawn cards (net card advantage is still +1 as designed, but the player never gets to discard a pre-existing hand card). This is intentional for MVP simplicity but is a known limitation worth revisiting if hand-filtering effects are added.
- REVIVE uses `resolveTargets(source: "graveyard")` — all graveyard cards are returned regardless of `isDestroyed` value.
- REVIVE's `maxPower` filter checks `basePower <= maxPower` (uses basePower so temporary debuffs don't affect eligibility).
- REVIVE tie-break rule: when multiple candidates share the minimum power, the card earliest in the graveyard array (entered first) is revived. This is tested and documented.
- LOCK sets `isLocked = true`, and the reducer skips configured effect resolution when a locked card is played.
- `removeCardFromGraveyard` is a standalone helper, separate from `removeCardFromBoard`, since graveyard is a flat array while board is nested by row.
- CONDITIONAL_BOOST is implemented as a self-buff when its condition is true.
- Supported CONDITIONAL_BOOST conditions: `SCORE_AHEAD`, `SCORE_BEHIND`, `OPPONENT_PASSED`, `ALLY_UNIT_COUNT_AT_LEAST`.
- LOWEST/HIGHEST target selectors are single-target selectors. Ties resolve by board order for deterministic behavior.

## Task 3.4-3.6 Fix History (2026-06-14)

- `targetResolver.test.ts`: replaced direct state mutation with immutable spread construction.
- `effectResolver.ts updateTargets`: extended to cover graveyard zone in addition to board and hand.
- `effectResolver.ts applyRevive`: added explicit tie-break comment and `basePower` clarification.
- `effectResolver.test.ts`: added REVIVE tie-break test case.
- Commit: `de4fdb1`.

## Card Pool Design (Task 3.7)

- Effect configs are now live on all 60 cards; all implemented effect types (BUFF, DAMAGE, DESTROY, DRAW_DISCARD, SUMMON, REVIVE, LOCK, CONDITIONAL_BOOST) are used.
- Only CLEAR_WEATHER remains a no-op (weather system not implemented yet).
- Budgets follow the product design tiers: common 4-6, elite 7-9, hero 10-12, legend 13-15.
- Qin identity: high power, direct removal (DESTROY, DAMAGE), few frills.
- Chu identity: swarm / token SUMMON, row BUFF, unit-count conditional scaling.
- Qi identity: DRAW_DISCARD hand management, DAMAGE enemy highest, conditional filtering.
- Zhao identity: CONDITIONAL_BOOST when behind, LOCK on pass, cavalry synergy BUFF.

## MVP Temporary Rules

- Round 3 draw tiebreaker in `round.ts`: if round 3 (the final round of a best-of-3) ends without a round winner, the match is awarded to the player with more `roundWins`. Only when round wins are also tied (true 0-0 deadlock) does the opponent win as a termination fallback (and opponent's `roundWins` is bumped so winnerId/roundWins stay consistent). This guarantees the game always terminates while respecting any actual round a player won.

## Phase 5 UI Architecture (Task 5.x)

> **Note**: The original demo shipped as **AI vs AI auto-play** (player watched,
> clicking Next / toggling Autoplay). It has since been upgraded to **Player vs
> AI** (player plays manually, AI responds automatically). The "Decisions" and
> "gameStore.ts key facts" below describe the *current* Player-vs-AI design;
> the historical AI-vs-AI architecture is preserved for reference.

### Decisions (current — Player vs AI)

- **Mode**: Player vs AI. Player plays cards / passes manually; the opponent AI responds automatically after each player action.
- **State management**: Zustand store (`gameStore.ts`) holds `GameState`, player/opponent faction, `lastAction` label, and `screen`.
- **AI used**: `chooseNormalAIAction` from `game-core` (upgraded from `chooseHeuristicAIAction` on 2026-06-21) — no React/browser imports inside game-core.
- **Player turn model**: `playCard` / `pass` commit the player's action, then `advanceOpponentAI` runs opponent turns until it's the player's turn again, the round ends, or the game ends. `commitAfterPlayer` makes the game-finished → result-screen transition atomic.
- **Round transitions**: `startNextRound()` applies `START_NEXT_ROUND`; if the opponent goes first in the new round, `advanceOpponentAI` runs immediately.
- **Screens**: Start → Game → Result (simple state machine via `screen: AppScreen`).
- **Task 4.2 status**: **Complete** (was originally skipped, later added — see `heuristicAI.ts`).

### Component Structure (current)

```
App.tsx
├── StartScreen        (faction pickers for player + opponent, Start button)
├── GameScreen         (opponent board → HUD → player board → hand area)
│   ├── PlayerBoard ×2 (3 rows + header + graveyard strip)
│   │   └── CardView   (power badge + name + effect emoji badge)
│   ├── HandView       (player hand as clickable card buttons)
│   └── RoundResultBanner (modal overlay when status === "round_finished")
└── ResultScreen       (winner, round wins, action count, Restart)
```

### gameStore.ts key facts (current)

- `playCard(cardInstanceId)` looks up the matching legal action (with row target) via `getLegalActions`, applies it, then commits via `commitAfterPlayer` so the opponent AI responds.
- `pass()` applies the player's `PASS`, then commits via `commitAfterPlayer`.
- `commitAfterPlayer` runs `advanceOpponentAI` when it becomes the opponent's turn, and atomically sets `screen: "result"` when the game finishes (avoids a one-frame flash of the finished board in GameScreen).
- `advanceOpponentAI(state)` loops opponent actions until `currentPlayerId !== "opponent"`, the round ends, or the game ends.
- `scores()` selector calls `calculateScores(gameState)` from game-core.
- The original AI-vs-AI `tick()` / `toggleAutoplay()` / `autoplay` fields were **removed** in the Player-vs-AI refactor — they no longer exist in the store.

## Phase 5 UI Upgrades & Bug Fixes (2026-06-15)

- **AI Upgrade**: Switched from random simple AI to `chooseHeuristicAIAction`, then to `chooseNormalAIAction`. Normal AI uses Utility-style scoring with hand value, catch-up cost, and round budget.
- **Mode Upgrade**: Refactored Zustand store and components to support Player-vs-AI mode where the player plays manually and AI responds automatically.
- **Hover/Tooltip Bug**: HTML `<button>` elements with `disabled` attributes prevent browser pointer events, causing hover tooltips (`title`) to disappear during opponent turns or when player passed. Fixed by removing the `disabled` attribute, handling click guards in JS, and using CSS classes for visual disabled states. Hand cards now remain hoverable at all times.
- **Card Badges**: Board card previews now display specialized skill emoji badges (`💀`, `🗡`, `⬆`, etc.) dynamically based on their effect definitions.

## Web Test Infrastructure (2026-06-17)

- Vitest added as a devDependency to `apps/web` (version `^4.0.15`, matching root).
- `apps/web/src/store/gameStore.test.ts` tests the Zustand store logic directly
  (no DOM/React rendering needed) — 10 tests covering lifecycle, playCard, pass,
  round flow, and full-match termination.
- Root `package.json` test script changed from `pnpm --filter @warring-states/game-core test`
  to `pnpm -r test` so both `@warring-states/game-core` and `@warring-states/web`
  run tests together.

## Phase 4 Simulator (Task 4.3, 2026-06-21)

- `simulateGame(config)` lives in `packages/game-core/src/simulator/simulateGame.ts`
  and is exported from `packages/game-core/src/index.ts`.
- The simulator is UI-free and composes existing game-core functions:
  `createInitialGameState`, `applyAction`, `calculateScores`, and an AI chooser.
- Default AI is `chooseNormalAIAction`, but callers can inject
  `chooseAction(state, playerId)` to compare AI strategies or test edge cases.
- Default decks duplicate the selected faction card pool to 30 cards per player,
  matching the current Player-vs-AI web mode.
- The simulator advances `playing` states through the selected AI and advances
  `round_finished` states with `START_NEXT_ROUND`.
- `maxTurns` is the infinite-loop guard. When reached, the result returns
  `stoppedReason: "max_turns"` and the latest `finalState`.
- Returned stats currently include winner, rounds, turns, final scores, round wins,
  action counts by type, action counts by player, stopped reason, and final state.
- Task 4.3 is an observation/simulation tool; it does not by itself strengthen the
  AI. The early over-spending issue was later addressed by Normal Utility AI
  tuning, and should continue to be measured through Task 4.4 matchup reports.

## Phase 4 Matchup Reports (Task 4.4, 2026-06-21)

- `simulateMatchup(config)` lives in
  `packages/game-core/src/simulator/simulateMatchup.ts` and is exported from
  `packages/game-core/src/index.ts`.
- `formatSimulationReport(report)` lives in
  `packages/game-core/src/simulator/report.ts` and returns a readable plain-text
  matchup summary.
- The report maps `factionA` to the simulator's `player` seat and `factionB` to
  the `opponent` seat.
- Aggregate stats include requested games, completed games, max-turn stops, wins,
  draws, win rates, average rounds, average turns, and average final scores.
- Card stats are collected by wrapping the AI chooser during `simulateGame`:
  - `timesDrawn`: each card instance observed outside the deck (hand, board, or
    graveyard) once per game.
  - `timesPlayed`: each `PLAY_CARD` action for the card.
  - `winRateWhenPlayed`: played-card wins divided by times played; a play counts
    as a win when the player who played that card wins the game.
  - `averageContribution`: MVP contribution proxy using the card's
    `currentPower` at the moment it is played. Effect side-effects are not yet
    attributed to the source card.
- Task 4.4 can run 1000 games with the current card pool in tests. This makes it
  suitable for measuring whether Normal AI over-spends cards after each tuning
  change.

## Normal Utility AI (2026-06-21)

- `chooseNormalAIAction` and `scoreNormalAIAction` live in
  `packages/game-core/src/ai/normalAI.ts`.
- Shared evaluation helpers live in `packages/game-core/src/ai/aiEvaluation.ts`.
- Normal AI scores every legal action instead of using a top-level `shouldPass`
  branch.
- State evaluation currently includes:
  - board score difference,
  - round-wins difference,
  - hand-size advantage,
  - deck-size advantage,
  - board-unit advantage.
- PLAY_CARD scoring simulates `applyAction`, then subtracts generic resource
  costs and soft penalties for over-budget early-round spending or expensive
  hopeless chases.
- PASS scoring rewards safe pass situations, especially when the opponent has
  already passed and Normal AI is ahead, or when catch-up is too expensive.
- Round budget is soft, not a hard rule:
  - round 1: max 4 cards,
  - round 2 while ahead on rounds: max 3 cards,
  - round 2 while behind on rounds: max 6 cards,
  - round 3: spend freely.
- Simulator defaults now use `chooseNormalAIAction`, and the web opponent also
  uses `chooseNormalAIAction`.
- 10-game Qin vs Chu observation after the switch:
  - Qin 9 wins, Chu 1 win.
  - Average rounds: 3.00; average turns: 27.90.
  - Average final scores: Qin 28.80 / Chu 19.70.
  - Early-round play counts were reduced compared with the original hand-dump
    behavior: round 1 mostly 1-5 plays, round 2 mostly 2-6 plays, round 3 mostly
    9-14 plays.
- Interpretation: Normal AI now conserves resources earlier and commits in round
  3. Qin vs Chu remains skewed, likely requiring faction/card-balance analysis or
  Chu-specific sequencing improvements through generic effect valuation, not
  card-id-specific AI rules.

## I18n First Pass (2026-06-22)

- Multilingual support is implemented in `apps/web/src/i18n`.
- The runtime is intentionally lightweight:
  - `translate(language, id, params)` resolves a text id.
  - `{param}` placeholders are interpolated with string/number values.
  - Missing locale entries fall back to English.
  - Missing ids fall back to the id string instead of crashing.
- Supported languages in the first pass: `en` and `zh`.
- Language state lives in `apps/web/src/store/settingsStore.ts` and is persisted
  with Zustand persist under `warring-states-settings`.
- `I18nProvider` exposes `useI18n()` with `language`, `setLanguage`, and `t`.
- `packages/game-core` remains independent from React/browser/i18n runtime. It
  only exposes stable text id fields on `CardDefinition`.
- `CardDefinition` now supports:
  - `nameTextId?: string`
  - `descriptionTextId?: string`
- `INITIAL_CARDS` auto-generates card text ids:
  - `card.<cardId>.name`
  - `card.<cardId>.description`
- Translation dictionaries auto-generate base card entries from `INITIAL_CARDS`
  so all card text ids exist in both English and Chinese dictionaries.
- Current limitation: Chinese card entries currently mirror existing card data
  where no final localized translation exists. The UI shell has real Chinese
  strings; card translation polish remains a content task.
- Localized surfaces in the first pass:
  - start screen,
  - language switcher,
  - faction labels,
  - game HUD round/status labels,
  - player board hand/deck/passed labels,
  - row labels,
  - hand empty text,
  - card names/descriptions via text ids,
  - result/round overlay primary labels.
- Dynamic store action labels (`lastAction`) still use string labels from
  `gameStore.ts`; a later pass should migrate them to `{ id, params }` messages
  as described in `docs/i18n_implementation_plan.md`.
- Tests now cover translation lookup, interpolation, fallback, dictionary key
  parity, card text id dictionary coverage, and stable card text id assignment.

## Phase 6: Campaign System (2026-06-21)

### Deck Rule Alignment — Gwent Style

- **Unified deck size**: both Quick Battle and Campaign now use **25 cards** per
  player. The previous 30-card duplication of the 15-card faction pool is
  replaced by a fill-to-25 strategy (pool repeated until reaching 25 cards).
- **Per-round draw**: `startNextRound` in `round.ts` now draws cards from the
  top of the shuffled remaining deck before play begins:
  - Entering round 2: each player draws **+2 cards**.
  - Entering round 3: each player draws **+1 card**.
  - If fewer cards remain in deck than the draw count, all remaining cards
    are drawn (no error).
- **Constants**: `DECK_SIZE = 25` and `ROUND_DRAW_COUNTS = { 2: 2, 3: 1 }`
  added to `constants.ts`.
- **Deck is pre-shuffled** in `createInitialGameState`; drawing always takes
  from the head of the already-shuffled deck. No additional randomness needed.

### Campaign Mode Design

- **Entry**: StartScreen gains a "Campaign" button alongside "Quick Battle".
  Quick Battle retains the existing faction-picker flow (no Deck Builder).
- **Screens**: `AppScreen` extended with `"level_select"` and `"deck_builder"`.
- **Deck Builder**: player picks 25 cards from the selected campaign faction
  plus neutral cards. Copies are capped by rarity so decks can reach 25 cards
  without stacking top-end cards.
- **Opponent decks**: each level uses a hand-crafted 25-card opponent deck
  (card IDs stored in `levelData.ts`). The opponent always uses Normal AI.

### 6 Level Designs

| # | Title | Opponent Strategy | Player Constraint | Win Condition |
|---|---|---|---|---|
| 1 | 铁壁 Iron Wall | Qin pure power — no effects | None | Standard 2/3 |
| 2 | 蜂涌 The Swarm | Chu SUMMON token flood | Rarity copy limits | Standard 2/3 |
| 3 | 谋算 The Scholar | Qi DRAW_DISCARD hand control | Rarity copy limits | Standard 2/3 |
| 4 | 逆转 The Comeback | Zhao CONDITIONAL_BOOST burst | None | Must win round 2 |
| 5 | 合纵 Coalition | Mixed elite units (4 factions) | Rarity copy limits | Standard 2/3 |
| 6 | 王道 Apex | Normal AI + best Qin 25 | None | Standard 2/3 |

### WinCondition Evaluation Strategy

- `WinCondition` judgment is **not placed in the game-core reducer** to keep
  the reducer pure.
- Evaluated post-game in `ResultScreen` from `gameState`:
  - `"standard"`: `gameState.winnerId === "player"`.
  - `"must_win_round2"`: scan `actionLog` for the round-2 settlement entry
    and check `roundWinnerId === "player"`.

### Save / Persistence

- `saveStore.ts` in `apps/web/src/store/` uses Zustand `persist` middleware
  backed by `localStorage`.
- Stores: `completedLevelIds: string[]`.
- Methods: `markComplete(levelId)`, `isComplete(levelId)`, `reset()`.
- No account system; save is local to the browser.

### Portability Note (iOS / WeChat Mini-Program)

- `packages/game-core` remains fully independent of React and browser APIs.
  `levelTypes.ts` and `levelData.ts` are pure TypeScript data modules — safe
  to import on any platform.
- `saveStore.ts` uses `localStorage`; a Mini-Program port would replace the
  persist storage adapter with `wx.setStorage` without touching game-core.

## i18n Architecture (2026-06-22)

### Static vs. Dynamic Card Dictionaries

- **Initial design** (first i18n pass): `messages.zh.ts` and `messages.en.ts`
  imported `INITIAL_CARDS` and generated card entries dynamically via
  `flatMap`. This led to a silent bug — the Chinese dictionary fell back to
  `card.name` (English strings) for all 62 card name entries, making the zh
  localization appear complete in tests while being entirely English in the UI.
- **Fix**: Both files are now **fully static** explicit dictionaries with one
  key-value line per card name and description. The `INITIAL_CARDS` import was
  removed from both message files.
- **Trade-off**: Adding a new card now requires updating both message files in
  addition to `cardData.ts`. The `messages.test.ts` "card text ids exist in all
  dictionaries" test will catch any new card whose keys are missing.
- **Chinese translation convention**:
  - Historical figures: use canonical Chinese names (e.g. 商鞅, 白起, 廉颇).
  - Generic units: faction + role in Chinese (e.g. 秦国步卒, 楚国武士).
  - Skill descriptions: numeric values and targets exactly match English;
    one sentence of historical context added where space permits.

### Deck Builder i18n Gap

- `DeckBuilderScreen` was the only major screen that never called `useI18n()`.
  All string literals were hardcoded English. Found and fixed 2026-06-22.
- New key namespaces: `deckbuilder.*` (16 keys), `levelselect.*` (4 keys).
  Both zh and en dictionaries updated in the same commit.

## Deck Builder Design (2026-06-22, updated 2026-06-23)

### Faction-Filtered Card Pool

- **Updated decision**: Campaign faction is selected on the Level Select screen.
  Deck Builder treats that faction as locked and only exposes cards from that
  faction plus neutral cards.
- **Rationale**: showing all 60 cards without filtering is unbalanced — a player
  could freely mix every faction's best cards. Locking the faction before deck
  construction makes Campaign identity clearer than allowing faction changes
  inside the builder.
- **Implementation**: `poolCards` is `useMemo`-derived from `playerFaction`;
  `LevelSelectScreen` owns the faction picker via `setPlayerFaction`, while
  `DeckBuilderScreen` only displays the locked faction badge.
- **Store guard**: `toggleCardInDeck` rejects off-faction cards during Campaign,
  so the rule is enforced below the UI layer as well.
- **Copy limits**: because each faction has fewer than 25 directly buildable
  non-token cards, legal copies are allowed, but capped by rarity: legend/hero
  1, elite 2, common 3. Removing a card is handled by `removeCardFromDeck`
  from the deck list.
- **Campaign constraints**: old `requiredFactions`, `minFactions`, and
  no-duplicates level constraints are incompatible with one-faction decks and
  were removed from the current 6 levels.
- **Token exclusion**: `qin-token` and `chu-token` are always excluded from the
  pool (they are only reachable via SUMMON effects, not direct play).
- **Neutral faction**: the `"neutral"` faction bucket is included in the filter. 6 neutral cards exist in `cardData.ts` and are available to all factions during deck building.
- **Target selectors**: Added `"ALLY_HIGHEST"` target selector to find the highest-power active allied unit (used by `sun-tzu-art-of-war`).


### In-Page Card Description Tooltip

- **Decision**: card descriptions are displayed in a styled panel below the card
  list on hover/focus, not as a browser `title` attribute.
- **Rationale**: `title` tooltips are rendered by the browser in the system font
  with no i18n support — they would always appear in English regardless of the
  selected language. A React-controlled panel renders the translated description.
- **State**: `useState<{ name, description, power, row } | null>` local to
  `DeckBuilderScreen`; no store changes needed.
- **Keyboard accessibility**: `onFocus`/`onBlur` mirror `onMouseEnter`/`onMouseLeave`
  so the tooltip is accessible to keyboard-only users.
- **Positioning**: the tooltip is appended to the bottom of the `.card-pool` div.
  It does not use `position: absolute` / `position: fixed` to avoid z-index
  complexity and viewport edge clamping concerns.

## i18n Completeness Audit (2026-06-23)

### LevelDefinition Text Fields

- **Bug found**: `LevelDefinition` had `subtitle: string` and `hint: string`
  fields containing raw English text. The component rendered them directly
  (`{level.subtitle}`) without going through `t()`. Switching to Chinese had
  no effect on these strings.
- **Fix**: replaced both fields with `subtitleTextId: string` and
  `hintTextId: string`. Components call `t(level.subtitleTextId)` instead.
- **Convention**: level text keys follow `level.<level-id>.subtitle` and
  `level.<level-id>.hint` (e.g. `"level.level-1-iron-wall.subtitle"`).
- **Lesson**: any `LevelDefinition` or similar data-layer type should never
  carry pre-baked display strings. All human-visible text must be an i18n key
  reference if the data lives outside the component tree.

### Game Log: LogMessage Architecture

- **Bug**: `lastAction` in `gameStore.ts` was assembled as a formatted English
  string before being stored. This is the "store knows the language" anti-pattern.
- **Solution A chosen** over Solution B (per-client translation logic):
  - Store emits `LogMessage { id: string; params?: Record<string, string|number> }`.
  - UI resolves it: `resolveLog(msg)` in `App.tsx` calls `t(msg.id, params)`.
  - Card name is passed as `nameId` (itself an i18n key like `"card.bai-qi.name"`),
    which `resolveLog` resolves via a nested `t(nameId)` call before substitution.
  - This keeps the store layer completely language-agnostic.
- **LogMessage export**: `LogMessage` is exported from `gameStore.ts` so any
  future rendering target can import the type and implement its own `resolveLog`.
- **Effect type labels** (`fx` param): effect type names (e.g. `"DESTROY"`,
  `"BUFF"`) are currently passed as raw strings in the log. They are intentionally
  not translated for now — they serve as debug-level identifiers. If a more
  user-friendly effect description is needed in future, a `"effect.DESTROY.label"`
  key can be added without changing the store layer.

### Deck Builder: Card Copy Limits (2026-06-23)

- **Rule**: Card copies in a deck are limited based on their rarity (even when duplicate cards are allowed in general by a campaign level):
  - Legend: max **1** copy
  - Hero: max **1** copy
  - Elite: max **2** copies
  - Common: max **3** copies
- **Unique decks constraint**: If a campaign level has `allowDuplicates: false`, the limit is strictly **1** copy for all card rarities.
- **Visual feedback**: In the card pool, each card displays its count in the current deck along with its limit (e.g. `0/1`, `1/3`). Cards at their limit are visually disabled (`opacity: 0.35; cursor: default;`) and unclickable.
- **Store-level enforcement**: Both `toggleCardInDeck`, `autoFillDeck`, and `validateDeck` enforce these limits to prevent invalid decks from starting games.

## Campaign UX / Battle Readability (2026-06-24)

### One Campaign Deck

- **Decision**: Campaign uses one deck for the currently selected faction across
  levels. Selecting a different level no longer clears `playerDeck`.
- **Level selection**: after a legal 25-card campaign deck exists, selecting a
  level starts that battle directly. Deck Builder is only shown for the first
  deck build or when the existing deck fails validation for the selected level.
- **Faction lock**: on the Campaign screen, clicking a faction marks it as
  chosen and reveals its trait, but the picker stays available so the player can
  change their mind. Entering a level/deck build locks the faction; after that,
  the picker disappears and the store ignores further campaign
  `setPlayerFaction` calls until the player restarts / begins a fresh campaign.
- **Faction trait display**: faction traits are intentionally hidden before the
  choice is made, then shown after a faction is chosen using normal UI text
  sizing rather than a separate oversized style.
- **Rationale**: campaign should feel like taking one army through a sequence of
  challenges, not rebuilding from scratch before every fight.

### Battle Row Layout

- **Decision**: rows are arranged in the Gwent-like physical order:
  - opponent: siege / ranged / melee,
  - player: melee / ranged / siege.
- **Rationale**: melee rows should touch near the center of the battlefield; siege
  rows should be farthest away.

### Action History Panel

- `GameActionLogEntry` now carries optional `cardInstanceId` and `cardId` for
  `PLAY_CARD` entries.
- The web game screen renders a right-side scrollable history panel from
  `gameState.actionLog`, translating card ids through `cardDefinitions`.
- The center HUD still shows only the latest action; the side panel is for
  reviewing earlier plays and passes.

### Fixed Battle Viewport

- The web battle screen is constrained to exactly one viewport height. The page
  body/root no longer scroll vertically during battle.
- Oversized history/hand content uses internal scroll areas instead of dragging
  the whole page.
- Board cards and hand cards were slightly compacted so the Gwent-style row
  layout, HUD, hand, and right-side history can coexist on a 1440x900 viewport.

## Campaign Sequential Level Unlocking (Phase 7 / Task 7.4)

- **Rule**: Campaign levels must be completed in sequential order (Level 1 → Level 6). Once a player has cleared the final level (`level-6-apex`), the campaign is considered "cleared," and all levels are unlocked for free selection.
- **Implementation**:
  - `selectLevel` in `gameStore.ts` checks if the target level is unlocked. A level `i` is unlocked if: `isCampaignCleared` is true, or `i === 0` (first level), or the previous level `i - 1` is marked complete in the `saveStore` (`isComplete(CAMPAIGN_LEVELS[i - 1].id)`).
  - In `LevelSelectScreen.tsx`, locked levels are rendered with a padlock icon `🔒` in place of their index number, styled with `.level-card--locked`, and their button element is disabled.
- **Verification**: Tests in `gameStore.test.ts` assert the correctness of lock/unlock state transitions, save store synchronization, and free select upon campaign completion.

## AI Difficulty Profiles (Phase 7 / Task 7.3)

- **Rule**: AI difficulty should feel natural, progressive, and challenging.
- **Implementation**:
  - `chooseNormalAIAction` was modified to accept a `weights: UtilityAIWeights` parameter, forwarding it to `scoreNormalAIAction` to control evaluation priorities.
  - Three distinct weight profiles were defined in `aiEvaluation.ts`:
    - `EASY_AI_WEIGHTS`: Low card resource cost and hopeless chase penalties; low value on saving hand cards. AI plays aggressively/recklessly and dumps hand cards easily.
    - `NORMAL_AI_WEIGHTS`: Standard balanced utility-based valuation.
    - `HARD_AI_WEIGHTS`: High card resource cost and hopeless chase penalties; extremely high value on hand advantage and passing once a safe lead is secured. AI conserves cards carefully in rounds 1-2, and fights with maximum urgency in round 3.
  - Mapped difficulty ratings (1-5) to weights: difficulty 1-2 uses Easy weights, 3 uses Normal weights, and 4-5 uses Hard weights.
- **Verification**: Unit tests in `normalAI.test.ts` verify that passing different weights to `chooseNormalAIAction` under the exact same game state results in divergent decisions (e.g. Easy AI chooses to play a card while Normal AI chooses to pass to conserve resources).

## Pluggable AI Strategy Direction (Phase 8 / Task 8.1)

- User feedback after playable campaign testing: PvE works, but AI still feels
  too weak. Continuing to tune only `UtilityAIWeights` is likely brittle.
- **Decision**: Phase 8 should make AI implementations pluggable and compare
  multiple approaches under identical simulator conditions before changing the
  campaign default again.
- **Planned AI ids**:
  - `utility-v1`: current Utility AI wrapped as a baseline strategy.
  - `round-strategy`: adds a named three-round resource plan before tactical
    action scoring.
  - `lookahead-1ply`: evaluates each action plus one predicted opponent
    response.
- **Architecture note**: React and Zustand may select an AI id, but all action
  choice logic remains in `packages/game-core`.
- **Card-role rule**: strategy code may classify cards from generic config
  fields/effects (`DAMAGE`, `BUFF`, `DRAW_DISCARD`, rarity, power), but must
  not branch on individual card ids.
- **Benchmark rule**: AI strength should be compared through deterministic
  simulator reports, not only isolated unit tests or manual feel.
- Spec: `docs/superpowers/specs/2026-06-27-pluggable-ai-strategy-design.md`.
- Plan: `docs/superpowers/plans/2026-06-27-pluggable-ai-strategy.md`.

## Pluggable AI Strategy Implementation (Phase 8 / Task 8.1)

- `packages/game-core/src/ai/aiStrategy.ts` now owns the public strategy
  interface: `AIId`, `AIContext`, `AIStrategy`, `getAIStrategy`, and
  `chooseAIAction`.
- Implemented AI ids:
  - `utility-v1`: baseline wrapper around the old Utility AI behavior.
  - `round-strategy`: adds named three-round plans (`concede_round`,
    `cheap_catchup`, `contest_round`, `bleed_opponent`, `must_win`,
    `final_all_in`) before tactical action scoring.
  - `lookahead-1ply`: evaluates each legal action plus one predicted Utility V1
    opponent response.
- `chooseNormalAIAction` remains as a compatibility wrapper, but the baseline
  implementation is now named `chooseUtilityV1AIAction`.
- The previous Hard-weight-only benchmark assumption was removed. One-ply
  response search is now an explicit strategy instead of hidden inside Hard
  weights.
- `packages/game-core/src/ai/cardRoles.ts` classifies cards by generic
  definitions/effects, not card ids. Roles include `filler`, `tempo`,
  `removal`, `row_buff`, `setup`, `finisher`, and `resource`.
- `packages/game-core/src/ai/aiComparison.ts` provides deterministic
  AI-vs-AI comparison reports for strategy ids.
- Campaign AI selection now routes through `chooseAIAction` in
  `apps/web/src/store/gameStore.ts`:
  - difficulty 1-2: `utility-v1`,
  - difficulty 3: `round-strategy`,
  - difficulty 4-5: `lookahead-1ply`,
  - Quick Battle fallback: `round-strategy`.
- Current benchmark metrics are intentionally simple: win counts, win rates,
  draws, completed games, max-turn stops, average turns, and average rounds.
  Richer PvE diagnostics such as empty-hand losses and hand size by round are a
  good next tuning step.

## UI Polish Direction (Phase 9 / Task 9.1)

- `docs/battle interface/` defines the next UI direction: the app should feel
  less like a debug board and more like a focused Warring States card-battle
  table.
- Home screen target:
  - large game identity and two primary entries: Campaign and Quick Battle;
  - keep language switching and profile management, but reduce their visual
    weight compared with the main play entries;
  - use the reference image's dark/gold Warring States mood without adding
    animation or unrelated routing.
- Battle screen target:
  - fixed one-screen layout remains mandatory;
  - row order remains Gwent-like: opponent siege/ranged/melee, then player
    melee/ranged/siege;
  - central status should answer "which small round, whose turn, what is the
    score, what should I do now";
  - PASS wording must be explicit: "放弃本小局 / PASS" rather than ambiguous
    "放弃本轮";
  - right panel should prioritize enemy mechanism and recent actions; card
    hover/selection details temporarily replace the helper content;
  - policy/leader-skill slots can be displayed as disabled UI placeholders, but
    no policy gameplay rules are added in this task.
- Implementation constraint:
  - keep game rules out of React components;
  - do not touch `packages/game-core` unless a display bug reveals a missing
    data field that must be tested separately.

## UI Polish Implementation Notes (Phase 9 / Task 9.1)

- Home screen now prioritizes the two real player choices: Campaign and Quick
  Battle. Profile and faction selectors remain available, but visually sit below
  the primary game entry cards.
- Battle screen now has faction identity bars for both sides. These are display
  only and include a disabled policy-slot placeholder so future policy/leader
  skills have a natural home without adding rules now.
- Center battle status now favors player decisions:
  - small round / best-of-three label;
  - large scoreline;
  - active side;
  - current action hint;
  - latest resolved log message.
- Right sidebar now defaults to enemy mechanism:
  - campaign battles use the current level title, subtitle, and hint;
  - quick battles use the opponent faction trait;
  - card hover still temporarily shows card details.
- The full chronological action log remains in `GameState.actionLog`, but the
  sidebar view shows recent entries first so it works as battle context instead
  of a debug console.
- No `packages/game-core` rule logic changed in this UI pass.
- **Hand Card Selected Display Bug (Fixed 2026-06-27)**:
  - **Issue**: Selecting a card in the battle hand view caused the card's gold border to stretch all the way down to the unshifted bottom of the container, leaving empty space below the card. Also, the top of the card was clipped.
  - **Root Cause**: 
    1. Browsers have a focus outline rendering bug on transformed buttons where the native focus outline stretches from the transformed top to the untransformed layout bottom.
    2. The `.hand-view__cards` container had a height of `96px` and padding of `6px 0`, which was smaller than the selected card's scaled and translated visual height (`92px * 1.1 = 101.2px` plus a `-12px` translation). Since the parent container `.battle-hand-container` had `overflow-x: auto`, it clipped the top vertical overflow.
  - **Fix**:
    1. Added `outline: none !important;` to `.hand-card` and `.hand-card--selected` to completely suppress the browser's focus outlines.
    2. Increased the `.hand-view__cards` container height to `122px` and set padding to `20px 0 10px 0`, aligning cards to the bottom using `align-items: flex-end`. This provides enough space for selected cards to scale and translate upwards without getting clipped by the scroll container.
- **Card Preview Badge Styling and Translation Bugs (Fixed 2026-06-27)**:
  - **Issue 1**: The card detail preview badges in the right sidebar (e.g., `[赵] [攻城] [普通] [单位牌]`) appeared large, squished, and unstyled, instead of matching the mockup designs.
  - **Issue 2**: The right sidebar's action history header was displaying the raw translation key `game.recentActions` in Chinese.
  - **Root Cause**:
    1. A class name mismatch: `App.tsx` rendered the badges and their layout container using classes `sidebar-badge`, `sidebar-card-metadata`, `sidebar-card-body`, and `sidebar-card-desc`. However, `global.css` defined these styles under `.preview-badge`, `.preview-frame-metadata`, `.preview-frame-body`, and `.preview-frame-desc`. Consequently, none of the padding, size, colors, or spacing styles were applied.
    2. The translation key `"game.recentActions"` was missing from both `messages.zh.ts` and `messages.en.ts` dictionaries.
  - **Fix**:
    1. Updated `App.tsx` class names to align with `global.css` definitions (`sidebar-card-metadata` -> `preview-frame-metadata`, `sidebar-badge` -> `preview-badge`, etc.).
    2. Added the `"game.recentActions"` keys to `messages.zh.ts` ("最近行动") and `messages.en.ts` ("Recent Actions").


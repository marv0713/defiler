# Progress Log

## 2026-06-12

### Session Recovery

- Confirmed there was no existing `task_plan.md`, `progress.md`, or `findings.md`.
- Found `docs/tasks.md` as the project roadmap.
- Confirmed git branch is `main` and the working tree initially had only current in-progress implementation changes after Task 1.1/1.2 work.
- Verified Phase 0 scaffold before continuing:
  - `pnpm test` passed.
  - `pnpm typecheck` passed.
- `pnpm build` passed.

### Task 3.6: Implement Resource Effects

- Added `source` parameter to `resolveTargets` (board/graveyard) so REVIVE can target graveyard cards.
- Graveyard targets are not filtered by `isDestroyed` (since all graveyard cards are destroyed).
- Updated `targetResolver.test.ts` with graveyard source test.
- Implemented three new effects in `effectResolver.ts`:
  - `DRAW_DISCARD` — draws from top of deck, discards from end of hand (deterministic auto-discard).
  - `REVIVE` — resolves graveyard targets, moves card back to board with `isDestroyed = false`, supports `maxPower` filter.
  - `LOCK` — sets `isLocked = true` on board targets.
- Added `removeCardFromGraveyard` helper.
- Added 8 new tests: 3 for DRAW_DISCARD, 3 for REVIVE, 3 for LOCK (1 additional in targetResolver).
- Verification:
  - `pnpm test` passed with 69 tests across 13 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 3.5: Implement Basic Effect Resolver

- Added `packages/game-core/src/effects/effectResolver.ts`.
- Added `packages/game-core/src/effects/effectResolver.test.ts`.
- Implemented `resolveEffects` with support for:
  - `BUFF` — increases target `currentPower`, adds `PowerModifier`.
  - `DAMAGE` — decreases target `currentPower` (floor 0), adds `PowerModifier`.
  - `DESTROY` — removes target from board, marks destroyed, moves to graveyard.
  - `SUMMON` — creates token `CardInstance` on specified row from `cardDefinitions`.
- Added `cardDefinitions: Record<string, CardDefinition>` to `GameState`.
- Updated `createInitialGameState` to populate `cardDefinitions` from deck configs.
- Updated `applyPlayCard` in reducer to call `resolveEffects` after playing a card.
- Effect randomness uses `createSeededRandom` with `${seed}-fx-${actionLog.length}`.
- All modifier IDs are deterministic (no `Date.now`).
- Updated all 7 existing test files to include `cardDefinitions: {}` in mock states.
- Verification:
  - `pnpm test` passed with 59 tests across 13 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 1.1: Define Core Types

- Added `packages/game-core/src/types.ts`.
- Exported core types from `packages/game-core/src/index.ts`.
- Added a type contract test in `packages/game-core/src/index.test.ts`.
- Verification:
  - `pnpm exec tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck packages/game-core/src/index.test.ts` passed.
  - `pnpm test` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 1.2: Add Constants

- Added `packages/game-core/src/constants.ts`.
- Exported constants from `packages/game-core/src/index.ts`.
- Added tests for `ROWS`, `FACTIONS`, `STARTING_HAND_SIZE`, and `MAX_ROUND_WINS`.
- Verification:
  - First `pnpm test` failed as expected because `ROWS` was not exported yet.
  - After implementation, `pnpm test` passed with 3 tests.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Planning Files

- Added `task_plan.md`, `progress.md`, and `findings.md`.
- Kept `docs/tasks.md` as the long-term roadmap.

## Current Work

- Completed Phase 3 / Task 3.1: add initial card data.
- Next task is Phase 3 / Task 3.2: add card validation.
- Read `AGENTS.md` and continued following its project rules.

### Task 1.3: Implement Deterministic Random Utility

- Added `packages/game-core/src/utils/random.test.ts`.
- Confirmed the first `pnpm test` failed because `./random` did not exist.
- Added `packages/game-core/src/utils/random.ts`.
- Implemented:
  - `createSeededRandom(seed: string): () => number`
  - `shuffleWithSeed<T>(items: T[], seed: string): T[]`
- Exported both utilities from `packages/game-core/src/index.ts`.
- Verification:
  - `pnpm test` passed with 7 tests across 2 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 1.4: Implement Game Initialization

- Added `packages/game-core/src/rules/gameInit.test.ts`.
- Confirmed the first `pnpm test` failed because `createInitialGameState` was not implemented/exported.
- Added `packages/game-core/src/rules/gameInit.ts`.
- Implemented:
  - `CreateGameConfig`
  - `createInitialGameState(config: CreateGameConfig): GameState`
- Initialization now:
  - Creates deterministic card instances from card definitions.
  - Shuffles player and opponent decks with seed-derived shuffle seeds.
  - Draws `STARTING_HAND_SIZE` cards.
  - Leaves remaining cards in deck.
  - Initializes empty boards and graveyards.
  - Sets round 1, `playing` status, pass states, and round wins.
- Exported `createInitialGameState` and `CreateGameConfig` from `packages/game-core/src/index.ts`.
- Verification:
  - `pnpm test` passed with 8 tests across 3 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 2.1: Define Game Actions

- Added `packages/game-core/src/rules/actions.test.ts`.
- Confirmed explicit `tsc --noEmit` failed because action types were not exported.
- Added `packages/game-core/src/rules/actions.ts`.
- Implemented:
  - `ActionTarget`
  - `PlayCardAction`
  - `PassAction`
  - `StartNextRoundAction`
  - `RestartGameAction`
  - `GameAction`
- Exported action types from `packages/game-core/src/index.ts`.
- Verification:
  - `pnpm exec tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck packages/game-core/src/rules/actions.test.ts` passed.
  - `pnpm test` passed with 9 tests across 4 files.
  - `pnpm typecheck` passed.

### Task 2.2: Implement Scoring

- Added `packages/game-core/src/rules/scoring.test.ts`.
- Confirmed `pnpm test` failed because scoring functions were not implemented/exported.
- Added `packages/game-core/src/rules/scoring.ts`.
- Implemented:
  - `calculateRowScore`
  - `calculatePlayerScore`
  - `calculateScores`
- Scoring uses `currentPower` and ignores destroyed cards.
- Verification:
  - `pnpm test` passed with 12 tests across 5 files.
  - `pnpm typecheck` passed.

### Task 2.3: Implement Legal Actions

- Added `packages/game-core/src/rules/legalActions.test.ts`.
- Confirmed `pnpm test` failed because `getLegalActions` was not implemented/exported.
- Added `packages/game-core/src/rules/legalActions.ts`.
- Added minimal runtime card metadata to `CardInstance`:
  - `type`
  - optional `row`
- Updated game initialization to copy `type` and `row` from `CardDefinition`.
- Legal actions now:
  - Return no actions when game status is not `playing`.
  - Return no actions when it is not the player's turn.
  - Return no actions for a passed player.
  - Return pass action for active non-passed player.
  - Return row-targeted play actions for unit cards.
  - Return non-targeted play actions for special/weather cards.
- Verification:
  - `pnpm test` passed with 16 tests across 6 files.
  - `pnpm typecheck` passed.
  - Explicit test-file `tsc --noEmit` passed.

### Task 2.4: Implement Basic Reducer

- Added `packages/game-core/src/rules/reducer.test.ts`.
- Confirmed `pnpm test` failed because `applyAction` was not implemented/exported.
- Added `packages/game-core/src/rules/reducer.ts`.
- Implemented:
  - PLAY_CARD legality validation via `getLegalActions`.
  - Unit movement from hand to board row.
  - Special/weather movement from hand to graveyard.
  - PASS state update.
  - Turn switching, including keeping current player when opponent has passed.
  - Action log append.
- Fixed typecheck issues by using explicit switch narrowing.

### Task 2.5: Implement Round Settlement

- Added `packages/game-core/src/rules/round.test.ts`.
- Added reducer tests for both-pass settlement and reducer-driven `START_NEXT_ROUND`.
- Confirmed `pnpm test` failed before implementation.
- Added `packages/game-core/src/rules/round.ts`.
- Implemented:
  - `settleRound`
  - `startNextRound`
  - reducer hook for both-pass settlement
  - reducer support for `START_NEXT_ROUND`
- Round settlement now:
  - Calculates scores.
  - Increments round winner wins.
  - Ends the game at `MAX_ROUND_WINS`.
  - Moves board cards to graveyard when starting next round.
  - Clears boards and pass states.
- Verification:
  - `pnpm test` passed with 24 tests across 8 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

## 2026-06-13

### Task 3.1: Add Initial Card Data

- Added `packages/game-core/src/cards/cardData.test.ts`.
- Confirmed `pnpm test` failed before implementation because `INITIAL_CARDS` was not exported.
- Added `packages/game-core/src/cards/cardData.ts`.
- Exported `INITIAL_CARDS` from `packages/game-core/src/index.ts`.
- Added 20 initial cards:
  - 5 Qin cards.
  - 5 Chu cards.
  - 5 Qi cards.
  - 5 Zhao cards.
- Cards compile against `CardDefinition`.
- All cards include:
  - `id`
  - `name`
  - `englishName`
  - `faction`
  - `type`
  - `power`
  - `rarity`
  - `tags`
  - `effects`
  - `budget`
  - `description`
  - `row` for unit cards
- Verification:
  - `pnpm test` passed with 27 tests across 9 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 3.2: Add Card Validation

- Added `packages/game-core/src/cards/cardValidation.test.ts`.
- Confirmed `pnpm test` failed before implementation because `validateCards` was not exported.
- Added `packages/game-core/src/cards/cardValidation.ts`.
- Exported `validateCards` and `ValidationResult` from `packages/game-core/src/index.ts`.
- Implemented `validateCards(cards)` with:
  - duplicate id errors
  - unit-without-row errors
  - negative power errors
  - unknown faction errors
  - unknown row errors
  - unknown effect type errors
  - missing budget warnings
  - missing description warnings
- Current `INITIAL_CARDS` passes validation.
- Verification:
  - `pnpm test` passed with 33 tests across 10 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 3.3: Define Effect Types

- Added `packages/game-core/src/effects/effectTypes.test.ts`.
- Confirmed `pnpm test` failed before implementation because `EFFECT_TYPES` was not exported.
- Added `packages/game-core/src/effects/effectTypes.ts`.
- Defined:
  - `EFFECT_TYPES`
  - `EffectType`
  - `EffectDefinition`
  - `TargetSelector`
  - `ManualTargetRule`
  - `ConditionDefinition`
  - `EffectContext`
  - individual effect interfaces for all MVP effect types
- Updated `CardDefinition.effects` to use the formal `EffectDefinition` union.
- Updated card validation to reuse `EFFECT_TYPES` instead of maintaining a separate effect type whitelist.
- Adjusted the unknown-effect validation test to explicitly cast external dirty data through `unknown`, preserving strict typing while still testing validation behavior.
- Verification:
  - `pnpm exec tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck packages/game-core/src/effects/effectTypes.test.ts packages/game-core/src/cards/cardValidation.test.ts` passed.
  - `pnpm test` passed with 36 tests across 11 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

### Task 3.4: Implement Target Resolver

- Added `packages/game-core/src/effects/targetResolver.ts`.
- Added `packages/game-core/src/effects/targetResolver.test.ts`.
- Implemented `resolveTargets` with support for:
  - `SELF`
  - `ALLY_LOWEST`, `ALLY_RANDOM`, `ALLY_ROW`
  - `ENEMY_LOWEST`, `ENEMY_HIGHEST`, `ENEMY_RANDOM`, `ENEMY_ROW`
- Ensured destroyed cards are ignored in all selectors.
- Implemented deterministic `pickRandom` using context's `random` function.
- Exported `resolveTargets` from `packages/game-core/src/index.ts`.
- Verification:
  - `pnpm test` passed with 45 tests across 12 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.

## 2026-06-14

### Fix Pass: Tasks 3.4-3.6 Review Issues

- `targetResolver.test.ts`: fixed "ignores destroyed cards" test to use immutable spread construction instead of direct mutation.
- `effectResolver.ts updateTargets`: extended to cover graveyard zone in addition to board and hand.
- `effectResolver.ts applyRevive`: added explicit tie-break comment (earliest graveyard entry wins) and `basePower` clarification on `maxPower` filter.
- `effectResolver.test.ts`: added REVIVE tie-break test case.
- Verification:
  - `pnpm test` passed with 70 tests across 13 files.
  - `pnpm typecheck` passed.
  - Commit: `de4fdb1`.

### Task 3.7: Expand MVP Card Pool to 60 Cards

- Rewrote `packages/game-core/src/cards/cardData.ts` to 60 cards (15 per faction).
- Added 10 new Qin cards including `qin-token` (summon target).
- Added 10 new Chu cards including `chu-token` (summon target).
- Added 10 new Qi cards.
- Added 10 new Zhao cards.
- Filled in real effect configs on 13 existing placeholder cards:
  - Qin: legalist-officer (BUFF ALLY_LOWEST +3), qin-crossbow-formation (DAMAGE x2)
  - Chu: chu-shaman (SUMMON), chunshen-retainer (BUFF ALLY_RANDOM), xiang-yan (CONDITIONAL_BOOST)
  - Qi: jixia-scholar (DRAW_DISCARD), guan-zhong-legacy (DRAW_DISCARD), sun-bin (DAMAGE), tian-ji (DRAW_DISCARD)
  - Zhao: hu-clothing-cavalry (BUFF ALLY_ROW), li-mu (CONDITIONAL_BOOST), lian-po (CONDITIONAL_BOOST), zhao-raid (DAMAGE x2)
- Updated `cardData.test.ts` to assert pool >= 60 and per-faction >= 12.
- Verification:
  - `pnpm test` passed with 70 tests across 13 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - Commit: `4a861a4`.


### Housekeeping

- Found `targetResolver.ts` had unstaged changes from the 3.4-3.6 fix pass (graveyard source, helper refactor).
- Committed separately as `1593890`.
- All sources now clean (`git status` empty).

## Phase 4: AI and Simulator

### Next: Task 4.1 Simple AI

- Will create `packages/game-core/src/ai/simpleAI.ts`.
- `chooseSimpleAIAction(state, playerId)` must always return a legal action.
- Uses seeded random for deterministic play selection.
- Integration test must verify a full 3-round game completes.

### Task 4.1: Simple AI (Complete)

- Created `packages/game-core/src/ai/simpleAI.ts`.
- `chooseSimpleAIAction(state, playerId)`: prefers random PLAY_CARD; falls back to PASS.
- Random selection uses `createSeededRandom(seed + "-ai-" + playerId + "-" + logLength)` for determinism.
- 7 tests: legal action guarantee, empty-hand pass, fallback pass, play preference, determinism, no mutation, full-game integration.
- Also fixed: `settleRound` now applies a draw tiebreaker on round 3 (opponent wins) to prevent infinite loops on empty-hand later rounds.
- Added 2 new round tests covering the tiebreaker rule.
- Verification:
  - `pnpm test` passed with 79 tests across 14 files.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - Commits: `dbb8477` (simpleAI), `8b3c37a` (tiebreaker).

### Review Fixes: Task 3.4 through Task 4.1

- Kept `round.ts` round-3 draw tiebreaker as an MVP temporary strategy per user confirmation.
- Added regression tests for:
  - lowest/highest target tie-breaking
  - `CONDITIONAL_BOOST`
  - locked cards skipping skill resolution
  - explicit test-file typechecking for effect resolver/target resolver/simple AI tests
- Fixed `targetResolver` so `ALLY_LOWEST`, `ENEMY_LOWEST`, and `ENEMY_HIGHEST` return a single deterministic target using board order as tie-breaker.
- Implemented `CONDITIONAL_BOOST` in `effectResolver`:
  - `SCORE_AHEAD`
  - `SCORE_BEHIND`
  - `OPPONENT_PASSED`
  - `ALLY_UNIT_COUNT_AT_LEAST`
- Updated reducer so locked cards do not resolve their configured effects when played.
- Fixed `EffectContext` imports in effect tests so explicit test-file typechecking passes.
- Verification:
  - `pnpm test` passed with 84 tests across 14 files.
  - `pnpm typecheck` passed.
  - `pnpm exec tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck packages/game-core/src/effects/targetResolver.test.ts packages/game-core/src/effects/effectResolver.test.ts packages/game-core/src/ai/simpleAI.test.ts` passed.
  - `pnpm build` passed.

## Phase 5: React Web UI (AI vs AI Demo)

### Decision: Skip Task 4.2 (Heuristic AI)

- Task 4.2 complexity: moderate (score evaluation + pass heuristics, ~50-80 lines).
- User decision: skip 4.2 and 4.3/4.4 for now; go straight to UI so the game is visible in the browser.
- Task 4.2 remains in backlog; can be added before or after UI is working.

### Task 5.x: AI vs AI Demo UI (In Progress)

- User confirmed mode: AI vs AI auto-play, player watches and clicks Next / toggles autoplay.
- Files created so far:
  - `apps/web/src/store/gameStore.ts` — Zustand store; holds GameState, drives AI ticks, manages autoplay.
  - `apps/web/src/components/CardView.tsx` — displays card power + name slug; destroyed/locked CSS modifiers.
  - `apps/web/src/components/PlayerBoard.tsx` — shows three rows, score, hand/deck counts, pass state, graveyard preview.
- Still needed:
  - `App.tsx` rewrite (Start → Game → Result screens)
  - `global.css` game board styling
  - Dev server validation

## 2026-06-15

### Bug Fix Session: Three Issues from Code Review

#### Bug 1 (Medium): Round 3 draw tiebreaker — winnerId and roundWins inconsistent

- **File**: `packages/game-core/src/rules/round.ts`
- **Root cause**: `settleRound` set `winnerId = "opponent"` on a final-round draw but did
  not increment `opponent.roundWins`, leaving the Result screen showing "OPPONENT WINS"
  with "1 round win" (or 0).
- **Fix**: Extracted `isFinalRoundDraw` flag; when true, also increment
  `players["opponent"].roundWins` before returning, so `winnerId` and `roundWins` are
  always consistent.
- **Test update**: `round.test.ts` tiebreaker case now also asserts
  `opponent.roundWins === 1` and `player.roundWins === 0`.

#### Bug 2 (Low): Deck too small — 15 cards/faction, STARTING_HAND_SIZE = 10, deck exhausted in round 1

- **File**: `apps/web/src/store/gameStore.ts`
- **Root cause**: `buildDeck` returned only the 15 faction cards; after drawing 10, only 5
  remained. AI had almost no cards in rounds 2–3.
- **Fix**: `buildDeck` now duplicates the faction card array (`[...cards, ...cards]`),
  giving 30 cards per player. After drawing 10, 20 remain for three full rounds of play.

#### Bug 3 (Cosmetic): `tick()` — game_finished state flashes in GameScreen for one frame

- **File**: `apps/web/src/store/gameStore.ts`
- **Root cause**: `tick()` called `set({ gameState: next })` and then a separate
  `set({ screen: "result", autoplay: false })`, giving React time to render the finished
  board in GameScreen between the two updates.
- **Fix**: Merged into a single `set({ gameState, lastAction, screen, autoplay })` call
  when the game ends, so the transition is atomic.

#### Verification

- `pnpm test`: 84 tests / 14 files — all passed.
- `pnpm typecheck`: clean.
- `pnpm build`: clean (231 kB JS bundle).

### Upgrade: AI vs AI Demo → Player vs AI Mode

- **Goal**: Player manually plays cards; opponent AI responds automatically after each action.
- **New file**: `apps/web/src/components/HandView.tsx`
  - Displays player hand as clickable card buttons.
  - Each card shows power, English name, row badge (M/R/S), and description tooltip.
  - `canPlay` prop disables cards when it's not the player's turn or player has passed.
- **Modified**: `apps/web/src/store/gameStore.ts`
  - Removed: `tick`, `toggleAutoplay`, `autoplay`.
  - Added: `playCard(cardInstanceId)`, `pass()`, `startNextRound()`.
  - Added: `advanceOpponentAI()` — runs opponent turns until player's turn, round end, or game end.
  - Added: `commitAfterPlayer()` — after any player action, runs AI and commits state atomically.
  - `playCard` resolves the correct legal action (with row target) via `getLegalActions`.
  - `startNextRound` also runs AI if opponent goes first in the new round.
- **Modified**: `apps/web/src/App.tsx`
  - `GameScreen` redesigned: opponent board (top) → HUD → player board → hand area (bottom).
  - Hand area: status pill (Your turn / Opponent's turn / You passed / Round over).
  - Hand area: `HandView` with clickable cards.
  - Hand area: Pass button (visible only when player can act).
  - `RoundResultBanner`: modal overlay when `status === "round_finished"`; shows winner, round wins, "Start Round N+1" button.
  - Start screen: updated subtitle to describe Player vs AI.
  - Result screen: `result-winner` now uses `--player` (red) or `--opponent` (blue) color.
- **Modified**: `apps/web/src/styles/global.css`
  - `game-screen` grid: changed from 3 rows to 4 rows (added hand area row).
  - New sections: `.player-hand-area`, `.hand-status`, `.status-pill`, `.hand-view`, `.hand-card`, `.round-banner`.
  - Added `.result-winner--player` and `.result-winner--opponent` color variants.
- **Verification**:
  - `pnpm test`: 84 tests / 14 files — all passed.
  - `pnpm typecheck`: clean.
  - `pnpm build`: clean (234 kB JS bundle, +3 kB for new CSS).

### Integration: Heuristic AI & Hover Tooltip Bug Fix

- **AI Implementation**:
  - Added Heuristic AI to packages/game-core (`heuristicAI.ts`).
  - Added pass heuristic parameters (lead threshold, hand size, board placement constraints).
  - Added card value estimator to pick the highest impact play.
  - Verified with 9 new tests covering key pass triggers and full-game completions.
  - Connected `chooseHeuristicAIAction` inside `gameStore.ts`.
- **Hover Bug Fix**:
  - Modified `apps/web/src/components/HandView.tsx` to remove the HTML `disabled` attribute from the card buttons.
  - Handled click protection purely in JS using `onClick={() => canPlay && onPlay(card.instanceId)}`.
  - Allowed cards to receive pointer hover events at all times (resolves browser disabled-hover tooltip block).
  - Extended tooltips to display `englishName` + `description` in Gwent-style.
- **Verification**:
  - `pnpm test`: 93 tests / 15 files — all passed.
  - `pnpm typecheck` & `pnpm build` clean.

## 2026-06-17

### Code Review & Bug Fix Session

Reviewed all three docs (`progress.md`, `findings.md`, `task_plan.md`) against the
current implementation. Found and fixed 4 issues:

#### Bug 1 (Medium-High): Round-3 draw tiebreaker ignores prior roundWins

- **File**: `packages/game-core/src/rules/round.ts`
- **Root cause**: The final-round-draw tiebreaker unconditionally awarded the match to
  the opponent, ignoring any round wins a player had already earned. E.g., if the
  player won round 1 (1–0) and both round 2 and round 3 were draws, the opponent was
  declared match winner despite never winning a round.
- **Fix**: The tiebreaker now awards the match to the player with more `roundWins`.
  Only when `roundWins` are also tied (true 0–0 deadlock) does the opponent win as
  a termination fallback (and `opponent.roundWins` is bumped so `winnerId` and
  `roundWins` stay consistent).
- **Tests added**: 2 new cases in `round.test.ts`:
  - "awards the match to the round-win leader on a round-3 draw" (1–0 → round-3 draw)
  - "falls back to opponent-wins when round wins are also tied on round 3" (0–0 → round-3 draw, preserves original behavior)

#### Issue 2: Stale documentation in `findings.md`

- Fixed 4 out-of-date claims in `findings.md`:
  1. Tie-round behavior → added note about the updated round-3 tiebreaker logic.
  2. Task 4.2 status → corrected from "skipped" to "Complete" (heuristic AI shipped).
  3. Phase 5 UI Architecture → rewritten to describe the current Player-vs-AI mode
     (tick/autoplay removed, heuristic AI connected, component structure updated).
  4. Added DRAW_DISCARD caveat documenting that discarded cards always come from
     freshly-drawn cards (net advantage still +1 as designed).

#### Issue 3: Stale `task_plan.md` current phase

- Updated "Current Phase" from "Phase 3: Card Data and Effect System" to
  "Phase 5: React Web UI (Player vs AI) — Complete. Next: Phase 6".

#### Issue 4: No integration tests for `gameStore.ts`

- Added Vitest as a devDependency to `apps/web` (matching `game-core` setup).
- Updated root `package.json` test script from `pnpm --filter @warring-states/game-core test`
  to `pnpm -r test` so both packages are tested.
- Added `apps/web/src/store/gameStore.test.ts` — 10 tests covering:
  - Store lifecycle (start screen, startGame, restart, faction setters)
  - playCard (unit card moves to board, leaves hand; unknown card guard; wrong-turn guard)
  - pass + round flow (pass marks player passed, atomic screen transition)
  - Full match termination (driven to game_finished via store API without hanging)
- **Verification**:
  - `pnpm test`: 105 tests / 16 files (95 game-core + 10 web) — all passed.
  - `pnpm typecheck`: clean.
  - `pnpm build`: clean (236 kB JS bundle, 10.7 kB CSS).

## 2026-06-21

### Task 4.3: Game Simulation (Complete)

- **Goal**: Backfill the skipped Phase 4 simulator so AI vs AI games can be run
  without the React UI. This is the measurement foundation for tuning the weak
  AI behavior where it can over-spend cards in early rounds.
- **Added**: `packages/game-core/src/simulator/simulateGame.ts`
  - `simulateGame(config)` creates an initial game state and advances it until
    `game_finished` or `maxTurns`.
  - Originally defaulted to `chooseHeuristicAIAction`; after Normal Utility AI
    tuning, defaults to `chooseNormalAIAction`. Still accepts a custom `chooseAction`
    function for tests and future AI difficulty comparisons.
  - Builds default 30-card faction decks by duplicating the faction card pool,
    matching the current web app deck behavior.
  - Automatically applies `START_NEXT_ROUND` when the game reaches
    `round_finished`.
  - Returns `winner`, `rounds`, `turns`, `finalScores`, `roundWins`,
    `actionSummary`, `stoppedReason`, and `finalState`.
- **Added**: `packages/game-core/src/simulator/simulateGame.test.ts`
  - Verified one full AI vs AI game completes.
  - Verified `maxTurns` prevents infinite loops.
  - Verified custom AI chooser support.
- **Modified**: `packages/game-core/src/index.ts`
  - Exported `simulateGame` and its public result/config types.
- **TDD note**:
  - First simulator test run failed as expected because `./simulateGame` did not exist.
  - Implementation was added after the red test.
- **Verification**:
  - `pnpm --filter @warring-states/game-core test -- --run src/simulator/simulateGame.test.ts`: 98 game-core tests / 16 files — all passed.
  - `pnpm test`: 98 game-core tests + 10 web tests — all passed.
  - `pnpm typecheck`: clean.
  - `pnpm build`: clean (236.29 kB JS bundle, 10.70 kB CSS).

### Task 4.4: Matchup Simulation Report (Complete)

- **Goal**: Backfill the skipped Phase 4 batch simulator so AI and faction balance
  can be measured outside the UI.
- **Added**: `packages/game-core/src/simulator/simulateMatchup.ts`
  - `simulateMatchup(config)` runs many `simulateGame` matches for
    `factionA` vs `factionB`.
  - Aggregates games, completed games, max-turn stops, faction wins, draws, win
    rates, average rounds, average turns, and average final scores.
  - Adds card stats: `timesDrawn`, `timesPlayed`, `winsWhenPlayed`,
    `winRateWhenPlayed`, and `averageContribution`.
  - Accepts custom `chooseAction` so future Easy / Normal / Hard AI comparisons
    can reuse the same report pipeline.
- **Added**: `packages/game-core/src/simulator/report.ts`
  - `formatSimulationReport(report)` creates a readable text report with matchup
    rates and top played cards.
- **Added tests**:
  - `simulateMatchup.test.ts`: aggregate stats, card stats, and 1000-game smoke.
  - `report.test.ts`: readable text formatting.
- **Modified**: `packages/game-core/src/index.ts`
  - Exported `simulateMatchup`, `formatSimulationReport`, and public report types.
- **TDD note**:
  - First Task 4.4 test run failed as expected because `./simulateMatchup` and
    `./report` did not exist.
  - Implementation was added after the red test.
- **Verification**:
  - `pnpm --filter @warring-states/game-core test -- --run src/simulator/simulateMatchup.test.ts src/simulator/report.test.ts`: 102 game-core tests / 18 files — all passed.
  - `pnpm test`: 102 game-core tests + 10 web tests — all passed.
  - `pnpm typecheck`: clean.
  - `pnpm build`: clean (236.29 kB JS bundle, 10.70 kB CSS).

### AI Tuning: Normal Utility AI (Complete)

- **Goal**: Implement the Utility AI direction from
  `docs/ai_evolution_design.md` so the default opponent values hand resources,
  catch-up cost, and round budget instead of only using hard-coded pass rules.
- **Added**: `packages/game-core/src/ai/aiEvaluation.ts`
  - `evaluateStateForPlayer` scores score diff, round wins, hand advantage, deck
    advantage, and board unit advantage.
  - `estimateCardResourceCost` assigns generic resource cost from card power,
    effect templates, and rarity.
  - `estimateCatchupPlan` estimates points/cards/cost needed to overtake the
    current round score.
  - `getRoundBudget` gives early rounds a soft card budget and lets round 3 spend
    freely.
- **Added**: `packages/game-core/src/ai/normalAI.ts`
  - `scoreNormalAIAction` returns an inspectable score breakdown for legal
    actions.
  - `chooseNormalAIAction` scores all legal actions and chooses deterministically.
  - PASS is now a scored action, not a top-level `shouldPass` shortcut.
- **Added tests**:
  - `aiEvaluation.test.ts`: state evaluation, catch-up planning, round budget,
    current-round play counts, card resource cost.
  - `normalAI.test.ts`: legal action guarantee, pass when safely ahead, pass when
    catch-up is too expensive, play when one cheap card overtakes, pass after
    early-round budget, spend more freely in round 3, score breakdown shape.
- **Modified defaults**:
  - `simulateGame` and `simulateMatchup` now default to `chooseNormalAIAction`.
  - `apps/web/src/store/gameStore.ts` now uses `chooseNormalAIAction` for the
    opponent.
  - `packages/game-core/src/index.ts` exports Normal AI APIs and evaluation types.
- **10-game Qin vs Chu check**:
  - Completed: 10/10, max-turn stops: 0.
  - Result: Qin 9 wins, Chu 1 win.
  - Average rounds: 3.00; average turns: 27.90.
  - Average final scores: Qin 28.80 / Chu 19.70.
  - Per-round play counts showed early conservation and round-3 commitment:
    round 1 mostly 1-5 plays, round 2 mostly 2-6 plays, round 3 mostly 9-14 plays.
  - Interpretation: the "dump the whole hand early" behavior is improved; Qin vs
    Chu still looks skewed and should be investigated as faction balance / Chu AI
    sequencing rather than only pass timing.
- **Verification**:
  - `pnpm --filter @warring-states/game-core test -- src/ai/aiEvaluation.test.ts src/ai/normalAI.test.ts`: 115 game-core tests / 20 files — all passed.
  - `pnpm test`: 115 game-core tests + 10 web tests — all passed.
  - `pnpm typecheck`: clean.
  - `pnpm build`: clean (239.54 kB JS bundle, 10.70 kB CSS).

### UI I18n: English / Chinese First Pass (Complete)

- **Goal**: Add a lightweight text-id based multilingual layer for English and
  Chinese, following `docs/i18n_implementation_plan.md`.
- **Added**: `apps/web/src/i18n/`
  - `types.ts`: `Language`, `TextId`, `TranslationParams`, `MessageDictionary`.
  - `messages.en.ts`: English UI dictionary plus generated card text entries.
  - `messages.zh.ts`: Chinese UI dictionary plus generated card text entries.
  - `i18n.ts`: `translate`, interpolation, English fallback, card-name helpers.
  - `I18nProvider.tsx`: React context + `useI18n` hook backed by settings store.
  - `i18n.test.ts` and `messages.test.ts`: translation lookup, interpolation,
    fallback, dictionary parity, and card text id coverage.
- **Added**: `apps/web/src/store/settingsStore.ts`
  - Stores `language: "en" | "zh"` with Zustand persist under
    `warring-states-settings`.
- **Modified UI**:
  - `main.tsx` wraps App with `I18nProvider`.
  - `App.tsx` now uses `t(id)` for main start/game/result screen text and includes
    an English/Chinese language switcher on the start screen.
  - `HandView`, `CardView`, and `PlayerBoard` now support localized labels,
    localized card names/descriptions, localized row/hand/deck labels, and
    localized accessibility labels/tooltips.
  - `global.css` includes language switcher styling.
- **Modified game-core card data**:
  - `CardDefinition` now supports optional `nameTextId` and
    `descriptionTextId`.
  - `INITIAL_CARDS` automatically assigns `card.<id>.name` and
    `card.<id>.description`.
  - `validateCards` warns when text ids are missing.
  - `cardData.test.ts` asserts stable text ids for all cards.
- **Current limitation**:
  - Main UI strings have real English/Chinese entries.
  - Card text ids are present in both dictionaries, but Chinese card name and
    description entries currently mirror existing card data where no final
    localized translation exists yet. This is intentional for the first pass so
    the id/config architecture is in place before translation polish.
- **Manual browser check**:
  - Opened `http://localhost:5175/`.
  - Verified English start screen text.
  - Clicked `中文`; verified Chinese title/subtitle/faction labels/buttons render.
- **Verification**:
  - `pnpm --filter @warring-states/web test -- src/i18n/i18n.test.ts src/i18n/messages.test.ts`: 16 web tests — all passed.
  - `pnpm --filter @warring-states/game-core test -- src/cards/cardData.test.ts src/cards/cardValidation.test.ts`: 119 game-core tests — all passed.
  - `pnpm test`: 119 game-core tests + 16 web tests — all passed.
  - `pnpm typecheck`: clean.
  - `pnpm build`: clean (261.39 kB JS bundle, 17.00 kB CSS).

## 2026-06-21 (Phase 6 Planning)

### Phase 6 Design Approved

- **Goal**: Campaign system with Gwent-aligned deck rules and 6 challenge levels.
- **User decisions** (confirmed interactively):
  - Deck size: **25 cards** for both Quick Battle and Campaign (unified).
  - Per-round draw: Gwent original — entering round 2 draws +2, round 3 draws +1.
  - No narrative framing; pure rules-based challenge levels.
  - No card unlock rewards; player always has access to all 60 cards.
  - No mulligan mechanic (out of scope for MVP).
- **Documents updated**: `task_plan.md`, `findings.md`, `progress.md` all synced with
  Phase 6 design decisions.
- **Implementation plan** written and approved (stored in agent artifacts).
- **Next action**: Begin Layer 1 — add `DECK_SIZE` / `ROUND_DRAW_COUNTS` constants
  and implement `drawForNextRound` in `round.ts` with tests.

### Phase 6 Implementation (Complete)

All 6 layers executed in a single session. Summary of changes:

#### Layer 1: Gwent draw mechanic (game-core)
- `constants.ts`: Added `DECK_SIZE = 25`, `ROUND_DRAW_COUNTS = { 2: 2, 3: 1 }`.
- `round.ts`: Added `drawForNextRound(player, count)` — takes from deck head
  (already shuffled), returns updated player state with hand enlarged and deck
  shrunk. Called in `startNextRound` with `ROUND_DRAW_COUNTS[nextRound] ?? 0`.
- `round.test.ts`: 3 new tests (entering round 2 → +2 cards; entering round 3
  → +1 card; deck exhaustion graceful fallback).

#### Layer 2: Unified 25-card decks
- `simulator/simulateGame.ts`: `buildDefaultDeck` changed from `[...pool, ...pool]`
  (30 cards) to cyclic fill to `DECK_SIZE` (25 cards).
- `apps/web/src/store/gameStore.ts`: Same change to `buildDeck`.
- `index.ts`: Exported `DECK_SIZE` and `ROUND_DRAW_COUNTS`.

#### Layer 3: Campaign data (game-core)
- `campaign/levelTypes.ts`: New file — `DeckConstraint`, `WinCondition`,
  `LevelDefinition` types.
- `campaign/levelData.ts`: New file — `CAMPAIGN_LEVELS` array with 6 levels,
  each with a 25-card hand-crafted opponent deck and a per-level constraint.
- `index.ts`: Exported `CAMPAIGN_LEVELS` and campaign types.

#### Layer 4: Save store
- `apps/web/src/store/saveStore.ts`: Zustand `persist` store backed by
  `localStorage` under key `"warring-states-save"`. Stores `completedLevelIds`,
  exposes `markComplete`, `isComplete`, `reset`.

#### Layer 5: gameStore extension
- `AppScreen` type extended: `"level_select"`, `"deck_builder"` added.
- New fields: `selectedLevel`, `playerDeck`, `deckBuildError`, `campaignMode`.
- New actions: `goToLevelSelect`, `selectLevel`, `toggleCardInDeck`,
  `validateDeck`, `startLevelGame`, `levelPassed`.
- `startLevelGame` resolves card IDs → `CardDefinition[]` for both player and
  opponent and calls `createInitialGameState` with the custom decks.
- `restart` clears all campaign fields.

#### Layer 6: UI components
- `LevelSelectScreen.tsx`: 6 level cards in a responsive grid. Shows title,
  subtitle, difficulty stars, opponent faction, constraint badges, and a ✓
  when the level is complete (from `saveStore`).
- `DeckBuilderScreen.tsx`: Full 60-card pool (left, grouped by faction) with
  click-to-add/remove; deck list panel (right) with count, constraint tags,
  deck error message, and Start Battle button. Token cards excluded.
- `App.tsx`: Added campaign imports, split the Start button into Quick Battle +
  Campaign, wired `level_select`/`deck_builder` routes, updated `ResultScreen`
  with campaign pass/fail banner and Back to Levels / Next Level buttons.
  `markComplete` is called when the campaign `ResultScreen` renders with a pass.
- `global.css`: Added ~280 lines of new CSS for all campaign screens (level
  grid, deck builder split layout, constraint tags, result banner, dual-button
  start actions).

#### Verification
- `pnpm test`: 128 tests / 21 files (118 game-core + 10 web) — all passed.
- `pnpm typecheck`: clean.
- `pnpm build`: clean (255.28 kB JS, 16.59 kB CSS).

## 2026-06-22

### Card Translation Pass (zh i18n)

**Problem found**: `messages.zh.ts` was generating Chinese text by falling back to
`card.name` (English) and `card.description` (English) via a dynamic loop over
`INITIAL_CARDS`. All 62 card entries in the Chinese dictionary were therefore
still English — placeholder in effect.

**Fix**:
- Rewrote both `messages.zh.ts` and `messages.en.ts` as **static, explicit
  dictionaries** — no more `INITIAL_CARDS` import or runtime loop.
- Provided proper Chinese translations for all 62 card entries (60 playable +
  2 tokens across Qin / Chu / Qi / Zhao), covering both name and description.
- Translation principles:
  - Historical figures use canonical Chinese names (商鞅、白起、廉颇、李牧 etc.).
  - Unit names follow faction + role pattern (秦国步卒、楚国武士 etc.).
  - Skill descriptions mirror the English exactly in meaning and numeric values,
    with one-sentence historical flavour added where appropriate.
- `messages.test.ts` "card text ids exist in all dictionaries" test remained
  green (keys unchanged, values now genuinely Chinese).
- Verification: `npm test` — 135 tests / 23 files all passed; `npm run build` clean.

### Deck Builder UX Fixes

**Problems found**:
1. `DeckBuilderScreen` did not import `useI18n` — all UI text was hardcoded English.
2. Card descriptions were only available as native `title` attribute (browser
   tooltip) — no visible in-page explanation.
3. Card pool showed all 60 cards regardless of player faction — no balance
   constraint.

**Fixes**:

#### 1. Full i18n wiring — `DeckBuilderScreen.tsx` & `LevelSelectScreen.tsx`
- Both screens now call `useI18n()` and replace every hardcoded string with `t()`.
- 16 new translation keys added under `deckbuilder.*` and `levelselect.*`
  namespaces in both `messages.en.ts` and `messages.zh.ts`.

#### 2. Card description tooltip panel
- Added `useState<TooltipCard | null>` for hover state.
- `onMouseEnter`/`onMouseLeave` (and matching `onFocus`/`onBlur` for keyboard)
  populate the tooltip with the i18n-translated card name + description.
- Tooltip renders as a styled box pinned below the card list in the left panel,
  not as a browser `title` attribute — always visible in the chosen language.
- New CSS classes: `.pool-card-tooltip`, `.pool-card-tooltip__header`,
  `.pool-card-tooltip__name`, `.pool-card-tooltip__power`,
  `.pool-card-tooltip__desc`.

#### 3. Faction-filtered card pool
- `DeckBuilderScreen` now reads `playerFaction` from the store.
- A **faction selector** bar (4 faction buttons) appears at the top of the card
  pool. Clicking a faction calls `setPlayerFaction`, immediately re-filtering the list.
- Pool shows only cards whose `faction === playerFaction` or `faction === "neutral"`.
  Tokens (`qin-token`, `chu-token`) remain excluded.
- `startLevelGame` now passes `get().playerFaction` instead of hardcoded `"qin"`,
  so the faction banner in the game screen reflects the player's actual choice.
- New CSS classes: `.pool-faction-selector`, `.pool-faction-btn`,
  `.pool-faction-btn--active`.

**Verification**: `npm test` — 135 tests / 23 files all passed; `npm run build` clean
(280.81 kB JS, 18.22 kB CSS).

## 2026-06-23

### Fix: Campaign level subtitle/hint always displayed in English

**Root cause**: `LevelDefinition.subtitle` and `.hint` were raw English strings
stored directly in `levelData.ts` and rendered verbatim in `LevelSelectScreen`
and `DeckBuilderScreen` without going through `t()`.

**Fix**:
- `levelTypes.ts`: replaced `subtitle: string` / `hint: string` with
  `subtitleTextId: string` / `hintTextId: string`.
- `levelData.ts`: updated all 6 levels to reference
  `"level.<id>.subtitle"` / `"level.<id>.hint"` key strings.
- `messages.zh.ts` + `messages.en.ts`: added 12 new keys
  (6 subtitles + 6 hints) with proper Chinese translations.
- `LevelSelectScreen.tsx`: `{level.subtitle}` → `{t(level.subtitleTextId)}`.
- `DeckBuilderScreen.tsx`: `{selectedLevel.hint}` → `{t(selectedLevel.hintTextId)}`.
- Verification: 135 tests pass; build clean.

### Feat: Game log messages migrated to structured LogMessage (Solution A)

**Problem**: `lastAction` in `gameStore.ts` was a pre-baked English string
(e.g. `"🔵 Opponent plays 白起 [⚡ DESTROY]"`). Any future client — native
app, WeChat Mini-Program — would need to duplicate the string-assembly logic.

**Solution A chosen**: `lastAction` now stores `LogMessage { id, params }`
and the UI resolves it to a translated string via `t()` at render time.

**Architecture**:

```
store emits:  { id: "game.opponentPlayWithFx", params: { nameId: "card.bai-qi.name", fx: "DESTROY" } }
App.tsx resolveLog():
  1. t(params.nameId)  →  "白起"  (or "Bai Qi" in English)
  2. t(msg.id, { name: "白起", fx: "DESTROY" })  →  "🔵 对手打出了 白起【DESTROY】"
```

**Files changed**:
- `gameStore.ts`: added `LogMessage` export type; changed `lastAction: string|null`
  to `LogMessage|null`; updated 6 assignment sites.
- `App.tsx`: added `resolveLog()` helper; updated `hud__log` render.
- `messages.en.ts` + `messages.zh.ts`: 7 new `game.*` keys each; updated `game.yourTurn`.
- `gameStore.test.ts`: updated `lastAction` assertion to check `LogMessage.id`.
- Verification: 135 tests pass; build clean (283.85 kB JS).

### Phase 7 / Task 7.1: Campaign faction lock

**Problem**: Campaign deck building was still too loose for the intended PvE
identity. Deck Builder filtered the pool by `playerFaction`, but it also let the
player switch between Qin / Chu / Qi / Zhao inside the builder. Some level
constraints still assumed the old "pick from all 60 cards" design
(`requiredFactions`, `minFactions`, no-duplicate deck). After locking to a
single faction, those constraints would either be confusing or impossible.

**Fix**:
- `LevelSelectScreen.tsx`: added a Campaign faction selector above the level
  grid. This is now where the player chooses their campaign faction.
- `DeckBuilderScreen.tsx`: removed the in-builder faction switcher and replaced
  it with a locked faction badge plus hint text.
- `gameStore.ts`: enforced campaign card legality in the store. Campaign deck
  additions now accept only selected faction cards plus future neutral cards.
- `gameStore.ts`: changed pool-click semantics for duplicate-friendly levels:
  clicking a legal pool card adds a copy; deck-list removal uses the new
  `removeCardFromDeck(cardId)` action.
- `levelData.ts`: removed incompatible `requiredFactions`, `minFactions`, and
  no-duplicate constraints from the current campaign levels.
- `messages.en.ts` / `messages.zh.ts` and `global.css`: added the small set of
  labels and styles for the locked-faction flow.

**Tests added**:
- `apps/web/src/store/gameStore.test.ts`: campaign deck building only accepts
  selected-faction cards, supports repeated legal copies, removes one copy via
  `removeCardFromDeck`, and starts the campaign game with the selected faction.
- `packages/game-core/src/campaign/levelData.test.ts`: campaign level deck
  constraints stay compatible with one-faction deck building.

**Verification**:
- `pnpm --filter @warring-states/web test src/store/gameStore.test.ts`: 14 tests passed.
- `pnpm --filter @warring-states/game-core test src/campaign/levelData.test.ts`: 1 test passed.
- `npm test`: 140 tests passed across 24 files.
- `pnpm typecheck`: clean.
- `npm run build`: clean (285.18 kB JS, 19.18 kB CSS).

## 2026-06-23 (Continued)

### Bug Fix Session: Fixed Type Errors and Test Failures on Neutral Cards

#### Bug 1 (Critical): Type Errors in Card Definitions & Unresolved Effects/Targets
- **File**: `packages/game-core/src/cards/cardData.ts`, `packages/game-core/src/effects/effectTypes.ts`, `packages/game-core/src/effects/targetResolver.ts`
- **Root cause**: The newly introduced neutral cards `scouts-report` and `sun-tzu-art-of-war` used an invalid effect type `DRAW` (instead of `DRAW_DISCARD`) and `sun-tzu-art-of-war` used an invalid target selector `ALLY_HIGHEST` that wasn't defined in types or handled by the engine. This broke typecheck builds and `cardValidation.test.ts`.
- **Fix**:
  - Replaced the `DRAW` effects in `scouts-report` and `sun-tzu-art-of-war` with the valid `DRAW_DISCARD` effect with `draw: 1, discard: 0`.
  - Added `"ALLY_HIGHEST"` as a valid target selector type in `effectTypes.ts` and implemented its logic in `targetResolver.ts` so it returns the highest-power active allied unit.
  - Added unit tests for `ALLY_HIGHEST` in `targetResolver.test.ts`.

#### Bug 2 (Medium): Card text IDs dictionary coverage test failure
- **File**: `apps/web/src/i18n/messages.en.ts`, `apps/web/src/i18n/messages.zh.ts`
- **Root cause**: The 6 new neutral cards (`scouts-report`, `supply-wagon`, `forced-march`, `feigned-retreat`, `wandering-swordsman`, `sun-tzu-art-of-war`) were missing translation keys in the static translation files.
- **Fix**: Appended English and Chinese translation keys for name and description for all 6 cards.

#### Bug 3 (Low): gameStore auto-fill test failure
- **File**: `apps/web/src/store/gameStore.test.ts`
- **Root cause**: The deck builder auto-fill test asserted that all cards in an auto-filled deck belonged to the selected faction (e.g., `zhao`), but the store's auto-fill logic correctly includes both the player's faction and `neutral` cards.
- **Fix**: Updated the test assertion to expect either the player faction or the `neutral` faction.

#### Verification
- `pnpm test`: 142 tests / 24 files — all passed.
- `pnpm typecheck`: clean.
- `pnpm build`: clean (289.37 kB JS, 19.64 kB CSS).

### Feature: Rarity-Based Card Copy Limits in Deck Builder

#### Goal
Prevent players from adding unlimited copies of card rarities (such as selecting multiple `bai-qi` / Legendary cards) during campaign deck building.

#### Implementation
- **Copy limit configuration**:
  - Legend: max **1** copy
  - Hero: max **1** copy
  - Elite: max **2** copies
  - Common: max **3** copies
- **Modified**: `apps/web/src/store/gameStore.ts`
  - Added helper `getMaxCardCopies(cardId, allowDuplicates)` to compute limits.
  - Updated `toggleCardInDeck` to reject clicks once the card limit is reached.
  - Updated `autoFillDeck` to respect limits during auto-fill generation.
  - Updated `validateDeck` to check for and reject decks exceeding copy limits.
- **Modified**: `apps/web/src/components/DeckBuilderScreen.tsx`
  - Rendered `count/limit` labels (e.g. `0/3` or `1/1`) instead of simple counts (`×Count`) in the card pool.
  - Disabled and greyed out pool cards when the limit is reached or the deck is full.
- **Modified**: `apps/web/src/styles/global.css`
  - Styled `.pool-card-count--zero` to dim counts that are at `0` for cleaner scanning.
- **Modified**: `apps/web/src/store/gameStore.test.ts`
  - Fixed `starts a campaign game...` test which previously attempted to fill a deck with 25 copies of the same card (violating limits).
  - Added new integration test `enforces maximum card copy limits based on rarity` to test limit boundaries.

#### Verification
- `pnpm test`: 143 tests / 24 files — all passed.
- `pnpm typecheck`: clean.
- `pnpm build`: clean (289.82 kB JS, 19.68 kB CSS).

### Task 7.1 Closeout Review (2026-06-24)

- Reviewed 7.1 implementation against the current Campaign PvE design.
- Confirmed deck building is now: selected campaign faction + neutral cards,
  with rarity-based copy limits preventing stacks of high-impact cards.
- Fixed stale Level 3 hint/subtitle text that still described the removed
  no-duplicate constraint.
- Made card-pool cards at copy/deck limit truly disabled in the DOM, instead of
  only visually dimmed.
- Updated `task_plan.md` and `findings.md` to describe copy limits instead of
  unconstrained repeated copies.
- Verification:
  - `npm test`: 143 tests passed across 24 files.
  - `pnpm typecheck`: clean.
  - `npm run build`: clean (289.84 kB JS, 19.84 kB CSS).

### Bug Fix: Deck Builder visual flicker / noisy selected rows (2026-06-24)

- User-reported issue: Deck Builder card pool could appear to flash with many
  bright horizontal gold lines after selecting cards.
- Root cause likely combined two UI behaviors:
  - selected pool rows used a full bright gold border, so many selected cards
    produced a screen full of high-contrast horizontal lines;
  - the hover tooltip was mounted/unmounted below the scroll list, causing
    layout reflow during hover changes.
- Fix:
  - kept the tooltip panel mounted with a fixed minimum height and hidden empty
    state to avoid hover-driven layout shifts;
  - toned selected pool cards down to `border-gold` + darker background;
  - kept disabled selected rows from brightening on hover.
- Verification:
  - `npm test`: 143 tests passed across 24 files.
  - `pnpm typecheck`: clean.
  - `npm run build`: clean (289.88 kB JS, 19.92 kB CSS).

### Phase 7 / Task 7.2: Campaign UX and battle readability

**Scope approved**:
- Campaign faction traits should be visible on the campaign screen.
- Campaign deck should be built once and reused across levels.
- Battle rows should be physically ordered like Gwent: melee rows meet near the
  center, siege rows are farthest away.
- Battle screen should keep a right-side scrollable action history panel.

**Implementation**:
- `LevelSelectScreen.tsx`: added selected-faction trait panel under the campaign
  faction selector.
- `messages.en.ts` / `messages.zh.ts`: added faction trait copy and action
  history labels. Updated stale level hints that still referenced removed
  multi-faction/no-duplicate constraints.
- `gameStore.ts`: `selectLevel` now preserves `playerDeck`; `setPlayerFaction`
  clears campaign deck and selected level only when changing faction in campaign
  mode.
- `types.ts` / `reducer.ts`: action log entries now include `cardInstanceId` and
  `cardId` for played cards.
- `App.tsx`: added `ActionHistoryPanel` and changed row order so opponent is
  siege/ranged/melee and player is melee/ranged/siege.
- `global.css`: added right-side history panel and faction trait styling.

**Tests added**:
- `gameStore.test.ts`: campaign deck persists when selecting another level and
  clears when changing campaign faction.
- `reducer.test.ts`: `PLAY_CARD` action logs include `cardInstanceId` and `cardId`.

**Verification**:
- `npm test`: 145 tests passed across 24 files.
- `pnpm typecheck`: clean.
- `npm run build`: clean (292.94 kB JS, 21.29 kB CSS).

### Phase 7 / Task 7.2 Closeout polish: campaign lock + fixed battle viewport

**User-reported issues**:
- Campaign screen showed faction traits immediately and kept faction buttons
  visible after selection.
- Battle screen could be dragged vertically as a whole page instead of fitting
  into one viewport.

**Implementation**:
- Added `campaignFactionChosen` and `campaignFactionLocked` to `gameStore`.
- Campaign faction selection now has two states:
  - before selection, level cards are disabled and trait text is hidden;
  - after selection, the faction selector remains visible, the selected faction
    is highlighted, trait text appears, and the player can still switch faction;
  - entering a level/deck build locks the faction, replaces the selector with a
    locked badge, and reuses the same campaign deck across levels;
  - returning from a level/deck builder preserves the locked faction and deck;
  - `restart()` / fresh campaign entry resets the lock and clears the campaign
    deck.
- Updated `LevelSelectScreen.tsx` to conditionally render selector, locked badge,
  hint, and disabled level cards.
- Updated battle CSS so `html/body/#root/.app-root` and `.game-screen` are
  viewport-locked; hand/history scroll internally instead of scrolling the page.
- Made battle board/hand card sizing slightly more compact to keep all rows,
  HUD, hand, and right-side history visible.
- Updated zh/en i18n with `levelselect.chooseFactionFirst`.
- Updated `task_plan.md` and `findings.md` to reflect the locked-campaign rule.

**Tests added/updated**:
- `gameStore.test.ts`: faction can change before selecting a level.
- `gameStore.test.ts`: faction cannot change after campaign lock.
- `gameStore.test.ts`: level selection is blocked until faction is chosen.
- `gameStore.test.ts`: restart followed by fresh campaign entry unlocks faction
  choice and clears campaign deck.

**Verification**:
- `npm test`: 147 tests passed across 24 files.
- `pnpm typecheck`: clean.
- `npm run build`: clean (293.90 kB JS, 21.93 kB CSS).
- `curl -I http://localhost:5173/`: 200 OK.
- Browser smoke test:
  - initial Campaign page: no trait panel, 6 disabled level cards, no body scroll;
  - after choosing factions before a level: selector stays visible, active
    faction changes, trait shown, level cards enabled;
  - returning from Deck Builder preserves locked faction state and shows the
    locked badge;
  - Quick Battle game screen: `bodyScroll=false`, game height equals viewport
    height, hand area bottom equals viewport bottom.

### Fix: Campaign faction should not lock on first click

- User-reported issue: clicking a faction on Campaign immediately hid the
  picker, preventing switching to another faction before starting a level.
- Root cause: `setPlayerFaction()` set `campaignFactionLocked=true` immediately.
- Fix:
  - added `campaignFactionChosen` for the pre-level selection state;
  - `setPlayerFaction()` now only marks the faction as chosen;
  - `selectLevel()` requires a chosen faction and then locks it.
- Verification:
  - `npm test`: 148 tests passed across 24 files.
  - `pnpm typecheck`: clean.
  - `npm run build`: clean (294.04 kB JS, 21.93 kB CSS).
  - Browser smoke test confirmed Qin → Qi → Zhao switching works before level
    selection, and only locks after entering / returning from Deck Builder.

### Fix: Subsequent campaign levels should start directly with existing deck

- User-reported issue: after playing earlier campaign levels and returning to
  the level list, selecting a later level still opened Deck Builder.
- Root cause: `selectLevel()` always set `screen: "deck_builder"` after writing
  `selectedLevel`, even when `playerDeck` already held a legal 25-card deck.
- Fix:
  - `selectLevel()` now writes the selected level and locks the campaign faction;
  - if `playerDeck.length === DECK_SIZE` and `validateDeck()` passes for that
    level, it calls `startLevelGame()` immediately;
  - if the deck is missing or invalid, it still falls back to Deck Builder with
    the validation error.
- Tests:
  - added store regression test for selecting a later campaign level with an
    existing legal deck and landing directly on `screen: "game"`.
- Verification:
  - `npm test`: 149 tests passed across 24 files.
  - `pnpm typecheck`: clean.
  - `npm run build`: clean (294.21 kB JS, 21.93 kB CSS).
  - Browser smoke test: campaign choose Zhao → level 1 Deck Builder →
    Auto Fill 25/25 → back to levels → click level 3 landed on Game screen,
    not Deck Builder.

## 2026-06-24 (Continued)

### Phase 7 / Task 7.3 & 7.4: Campaign Sequential Level Unlocking and AI Difficulty Profiles

- **Goal**:
  1. Enforce sequential progression through the campaign levels. Once the campaign is cleared (last level complete), allow free select.
  2. Implement an AI difficulty curve that varies opponent playstyle challenge dynamically based on the level difficulty rating (1-5).
- **Implementation**:
  - **Sequential Unlock**:
    - `selectLevel` in `gameStore.ts` checks lock status. Level `i` is unlocked if: `isCampaignCleared` (Level 6 completed) OR `i === 0` OR previous level `i - 1` is completed in the save store.
    - `LevelSelectScreen.tsx` displays padlock `🔒` icons for locked levels, applies the `.level-card--locked` styling, and disables the button.
    - Added locked level button styling in `global.css`.
  - **AI Difficulty**:
    - Modified `chooseNormalAIAction` in `normalAI.ts` to take `weights: UtilityAIWeights`.
    - Added `EASY_AI_WEIGHTS` and `HARD_AI_WEIGHTS` weight profiles in `aiEvaluation.ts`.
    - Added `getAIWeightsForDifficulty(difficulty)` to map level difficulties (1-5) to weights.
    - Updated `advanceOpponentAI` in `gameStore.ts` to lookup level difficulty and pass the corresponding weights to `chooseNormalAIAction` during campaign mode.
    - Exported all weights and helper functions in `packages/game-core/src/index.ts`.
- **Tests Added**:
  - `gameStore.test.ts`: Added tests verifying level lock/unlock progression and campaign clear free select.
  - `normalAI.test.ts`: Added tests verifying `getAIWeightsForDifficulty` returns the expected weights, and `chooseNormalAIAction` respects the passed weights and makes different decisions under identical state.
- **Verification**:
  - `pnpm test`: 151 tests passed across 25 files (all tests green).
  - `pnpm typecheck`: clean.
  - `pnpm build`: clean, compiles successfully.

## 2026-06-27

### Phase 8 / Task 8.1 Planning: Pluggable AI Strategy

- Read current `task_plan.md`, `progress.md`, `findings.md`, and existing AI
  design docs.
- Confirmed current playable state:
  - Phase 7 campaign polish is complete.
  - AI difficulty profiles exist, but they are primarily weight profiles over
    the current Utility AI.
  - User feedback is that PvE still feels too weak.
- Design direction agreed before implementation:
  - do not keep relying mainly on weight tuning;
  - make AI implementations pluggable and easy to replace;
  - implement three AI approaches and compare them:
    - `utility-v1` baseline,
    - `round-strategy`,
    - `lookahead-1ply`;
  - benchmark strategies against each other with deterministic simulator
    reports before deciding campaign defaults.
- Added spec:
  - `docs/superpowers/specs/2026-06-27-pluggable-ai-strategy-design.md`
- Added implementation plan:
  - `docs/superpowers/plans/2026-06-27-pluggable-ai-strategy.md`
- Updated working memory files before code implementation:
  - `task_plan.md`: Phase 8 / Task 8.1 marked Planned.
  - `findings.md`: recorded pluggable AI strategy direction and constraints.
  - `progress.md`: recorded this planning step.
- No AI implementation code has been changed in this step.

### Phase 8 / Task 8.1 Implementation: Pluggable AI Strategy

- Implemented AI strategy interface and registry:
  - `packages/game-core/src/ai/aiStrategy.ts`
  - `AIId = "utility-v1" | "round-strategy" | "lookahead-1ply"`
  - `chooseAIAction({ aiId, state, playerId, weights })`
- Split the old Utility AI baseline:
  - `chooseUtilityV1AIAction` is the baseline implementation.
  - `chooseNormalAIAction` remains as a compatibility wrapper.
- Added generic card role classification:
  - `packages/game-core/src/ai/cardRoles.ts`
  - roles derived from generic card definition/effect data, not card ids.
- Added Round Strategy AI:
  - `packages/game-core/src/ai/roundStrategyAI.ts`
  - explicit plans for conceding, cheap catch-up, contesting, bleeding, must-win,
    and final all-in situations.
- Added Lookahead 1-Ply AI:
  - `packages/game-core/src/ai/lookaheadAI.ts`
  - evaluates each legal action plus one predicted Utility V1 opponent response.
- Added deterministic AI comparison benchmark:
  - `packages/game-core/src/ai/aiComparison.ts`
  - updated old `aiBenchmark.test.ts` to compare strategy ids rather than assume
    Hard weights alone must reach a fixed win-rate threshold.
- Routed web campaign AI through strategy ids in `apps/web/src/store/gameStore.ts`:
  - difficulty 1-2 => `utility-v1`;
  - difficulty 3 => `round-strategy`;
  - difficulty 4-5 => `lookahead-1ply`;
  - Quick Battle fallback => `round-strategy`.
- Added/updated tests:
  - `aiStrategy.test.ts`
  - `cardRoles.test.ts`
  - `roundStrategyAI.test.ts`
  - `aiComparison.test.ts`
  - `aiBenchmark.test.ts`
  - `gameStore.test.ts`
- Verification:
  - `pnpm --filter @warring-states/web test src/store/gameStore.test.ts`: 31 tests passed.
  - `pnpm --filter @warring-states/game-core test src/ai`: 46 tests passed across 9 files.
  - `npm test`: 169 tests passed across 29 files.
  - `pnpm typecheck`: clean.
  - `npm run build`: clean (300.41 kB JS, 26.05 kB CSS).
- Note:
  - A direct `node -e import('@warring-states/game-core')` sample could not run
    because the workspace package exports TypeScript source for Vite/Vitest and
    is not installed as a built Node package. The deterministic comparison path
    is covered by `aiComparison.test.ts`.

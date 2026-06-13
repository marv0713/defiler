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


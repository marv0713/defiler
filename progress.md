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

- Completed Phase 2 / Task 2.4 and Task 2.5.
- Next task is Phase 3 / Task 3.1: add initial card data.
- Read `agent.md` and recorded its project rules in `task_plan.md` and `findings.md`.

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

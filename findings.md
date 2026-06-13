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
- Tie rounds currently produce no `roundWinnerId` and no round-win increment.
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
- `updateTargets` is a shared helper that replaces cards matching target instanceIds across both players' boards and hands.
- DESTROY is a two-step: `removeCardFromBoard` then `addCardToGraveyard` (with `isDestroyed: true`).
- DRAW_DISCARD, REVIVE, LOCK, CLEAR_WEATHER, and CONDITIONAL_BOOST are typed but return state unchanged (placeholder for future tasks).

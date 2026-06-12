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

- `agent.md` has been added as a project rule file.
- It reinforces that game rules must stay out of React components and `packages/game-core` must remain independent from React/browser APIs.
- Gameplay changes require Vitest tests.
- Online multiplayer, payments, drag-and-drop, and animations are out of scope unless explicitly requested.
- Card behavior should remain config-driven; do not hardcode one function per card.
- The file lists `npm test` and `npm run build`, but this pnpm workspace currently verifies with `pnpm test`, `pnpm typecheck`, and `pnpm build`.

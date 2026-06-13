# Task Plan: Warring States Card Tactics

## Goal

Build the browser-first MVP described in `docs/product_design_document.md`, using `docs/tasks.md` as the long-term task roadmap.

## Source Documents

- `docs/product_design_document.md`
- `docs/technical_design_document.md`
- `docs/tasks.md`
- `AGENTS.md`

## Current Phase

Phase 3: Card Data and Effect System

## Task Status

| Task | Status | Notes |
|------|--------|-------|
| Phase 0 / Task 0.1 | Complete | React + TypeScript + Vite workspace scaffold exists. |
| Phase 0 / Task 0.2 | Complete | Vitest is configured for `packages/game-core`. |
| Phase 1 / Task 1.1 | Complete | Core types added in `packages/game-core/src/types.ts` and exported from `index.ts`. |
| Phase 1 / Task 1.2 | Complete | Shared constants added in `packages/game-core/src/constants.ts` and exported from `index.ts`. |
| Phase 1 / Task 1.3 | Complete | Deterministic seeded random utility and shuffle added. |
| Phase 1 / Task 1.4 | Complete | Initial game state creation added. |
| Phase 2 / Task 2.1 | Complete | Game action and target types added. |
| Phase 2 / Task 2.2 | Complete | Board scoring added. |
| Phase 2 / Task 2.3 | Complete | Basic legal action generation added. |
| Phase 2 / Task 2.4 | Complete | Reducer handles play card, pass, and start-next-round. |
| Phase 2 / Task 2.5 | Complete | Round settlement and next-round flow added. |
| Phase 3 / Task 3.1 | Complete | Initial 20-card MVP faction pool added. |
| Phase 3 / Task 3.2 | Complete | Card definition validation added. |
| Phase 3 / Task 3.3 | Complete | Formal effect type system added. |
| Phase 3 / Task 3.4 | Complete | Automatic target resolver implemented. |
| Phase 3 / Task 3.5 | Complete | Basic effect resolver (BUFF, DAMAGE, DESTROY, SUMMON) implemented. |

## Next Task: 3.6 Implement Resource Effects (DRAW_DISCARD, REVIVE, LOCK)

- Already have types and target resolver.
- Keep the same config-driven approach.

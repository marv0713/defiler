# Task Plan: Warring States Card Tactics

## Goal

Build the browser-first MVP described in `docs/product_design_document.md`, using `docs/tasks.md` as the long-term task roadmap.

## Source Documents

- `docs/product_design_document.md`
- `docs/technical_design_document.md`
- `docs/tasks.md`
- `agent.md`

## Current Phase

Phase 2: Actions, Reducer, Scoring, and Round Flow

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
| Phase 3 / Task 3.1 | Pending | Add initial card data. |

## Active Task: 3.1 Add Initial Card Data

### Requirements

Add a small initial card pool in `packages/game-core/src/cards/cardData.ts`.

### Acceptance Criteria

- At least 20 cards exist.
- Card ids are unique.
- Cards compile against `CardDefinition`.

## Guardrails

- Keep game core independent from React, browser APIs, DOM, CSS, and localStorage.
- Prefer pure functions and TypeScript types.
- Do not use `Math.random` inside game-core rules.
- All gameplay changes must include Vitest tests.
- Do not hardcode one function per card; use config-driven effects.
- Keep changes small and reviewable.

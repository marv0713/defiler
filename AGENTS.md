# AGENTS.md

## Project Rules

- Do not put game rules inside React components.
- Keep `packages/game-core` independent from React and browser APIs.
- All gameplay changes must include Vitest tests.
- Do not implement online multiplayer.
- Do not implement payments.
- Do not add drag-and-drop unless explicitly requested.
- Do not add animations unless explicitly requested.
- Do not hardcode one function per card.
- Use config-driven effects.
- Keep changes scoped to the current task in `docs/tasks.md`.

## Validation Commands

Run before reporting completion:

```bash
npm test
npm run build
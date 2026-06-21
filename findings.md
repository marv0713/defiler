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
- **Deck Builder**: player picks any 25 cards from all 60 in the pool.
  Per-level `DeckConstraint` can require: a minimum faction mix, specific
  factions included, or no duplicate cards. Constraints are validated before
  the Start Battle button is enabled.
- **Opponent decks**: each level uses a hand-crafted 25-card opponent deck
  (card IDs stored in `levelData.ts`). The opponent always uses Normal AI.

### 6 Level Designs

| # | Title | Opponent Strategy | Player Constraint | Win Condition |
|---|---|---|---|---|
| 1 | 铁壁 Iron Wall | Qin pure power — no effects | None | Standard 2/3 |
| 2 | 蜂涌 The Swarm | Chu SUMMON token flood | ≥3 Qin cards | Standard 2/3 |
| 3 | 谋算 The Scholar | Qi DRAW_DISCARD hand control | No duplicate cards (25 unique) | Standard 2/3 |
| 4 | 逆转 The Comeback | Zhao CONDITIONAL_BOOST burst | None | Must win round 2 |
| 5 | 合纵 Coalition | Mixed elite units (4 factions) | ≥2 factions in deck | Standard 2/3 |
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

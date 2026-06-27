# Implementation Tasks: Warring States Card Tactics

This document breaks the MVP into small implementation tasks that can be executed by Codex / Claude Code / Cursor step by step.

## How to Use This File

Before coding, the agent should read:

1. `docs/product_design_document.md`
2. `docs/technical_design_document.md`
3. `docs/tasks.md`

General rules for all tasks:

- Keep the game core independent from React.
- Do not add online multiplayer.
- Do not add account systems.
- Do not add payment.
- Do not add drag-and-drop in MVP.
- Do not add complex animation.
- Do not create card-specific hardcoded functions unless explicitly requested.
- Prefer pure functions and TypeScript types.
- Add tests for rule-engine behavior.
- Keep changes small and reviewable.

Recommended execution order:

```text
Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7
```

---

# Phase 0: Project Setup

## Task 0.1: Create Project Skeleton

### Goal

Create the initial project structure for a React + TypeScript + Vite Web app with a separated game-core module.

### Requirements

Create this structure:

```text
warring-card-game/
  package.json
  apps/
    web/
      package.json
      index.html
      src/
        main.tsx
        App.tsx
        styles/
          global.css
  packages/
    game-core/
      package.json
      src/
        index.ts
```

If using a simpler single-package setup, keep equivalent folders under `src/game-core` and `src/components`.

### Acceptance Criteria

- Project installs successfully.
- Web app starts locally.
- TypeScript compiles.
- No game logic is placed inside React components yet.

### Avoid

- Do not add routing.
- Do not add backend.
- Do not add UI libraries beyond what is necessary.

---

## Task 0.2: Add Testing Setup

### Goal

Add Vitest for game-core testing.

### Requirements

- Install Vitest.
- Add test script.
- Add one sample test.
- Ensure tests run successfully.

### Acceptance Criteria

- `npm test` or equivalent command runs.
- Sample test passes.

### Avoid

- Do not add complex test framework configuration.
- Do not add browser E2E tests yet.

---

# Phase 1: Core Types and Game Initialization

## Task 1.1: Define Core Types

### Goal

Implement the core TypeScript types described in the technical design document.

### Files

Create or update:

```text
packages/game-core/src/types.ts
packages/game-core/src/index.ts
```

### Required Types

Implement:

```ts
PlayerId
Faction
Row
CardType
Rarity
CardDefinition
CardInstance
PowerModifier
BoardState
PlayerState
GameState
GameStatus
```

### Acceptance Criteria

- Types compile.
- Types are exported from `index.ts`.
- No React dependency exists in game-core.

### Avoid

- Do not implement gameplay logic in this task.
- Do not create UI components.

---

## Task 1.2: Add Constants

### Goal

Add shared constants for rows, factions, and starting hand size.

### Files

```text
packages/game-core/src/constants.ts
```

### Requirements

Define:

```ts
ROWS
FACTIONS
STARTING_HAND_SIZE
MAX_ROUND_WINS
```

Suggested values:

```ts
STARTING_HAND_SIZE = 10
MAX_ROUND_WINS = 2
```

### Acceptance Criteria

- Constants are exported.
- No duplicated string arrays in later code.

---

## Task 1.3: Implement Deterministic Random Utility

### Goal

Create a small seeded random utility for shuffling and simulation.

### Files

```text
packages/game-core/src/utils/random.ts
```

### Requirements

Implement:

```ts
createSeededRandom(seed: string): () => number
shuffleWithSeed<T>(items: T[], seed: string): T[]
```

### Acceptance Criteria

- Same seed produces same shuffle.
- Different seeds usually produce different shuffles.
- Input array is not mutated.
- Tests cover deterministic behavior.

### Avoid

- Do not use Math.random directly inside game-core rules.

---

## Task 1.4: Implement Game Initialization

### Goal

Create a function that initializes a game state.

### Files

```text
packages/game-core/src/rules/gameInit.ts
```

### Requirements

Implement:

```ts
createInitialGameState(config: CreateGameConfig): GameState
```

Where config includes:

```ts
seed
playerFaction
opponentFaction
playerDeck
opponentDeck
firstPlayerId
```

The function should:

- Create card instances from card definitions.
- Shuffle decks.
- Draw starting hands.
- Initialize empty boards.
- Initialize graveyards.
- Set `currentRound = 1`.
- Set `status = "playing"`.
- Set `roundWins = 0`.

### Acceptance Criteria

- Both players have hands.
- Both players have decks.
- Boards are empty.
- Game status is playing.
- Tests cover initialization.

### Avoid

- Do not implement AI.
- Do not implement UI.

---

# Phase 2: Actions, Reducer, Scoring, and Round Flow

## Task 2.1: Define Game Actions

### Goal

Define action types used by players and AI.

### Files

```text
packages/game-core/src/rules/actions.ts
```

### Required Actions

Implement:

```ts
PlayCardAction
PassAction
StartNextRoundAction
RestartGameAction
GameAction
ActionTarget
```

### Acceptance Criteria

- Action types are exported.
- No reducer logic yet.

---

## Task 2.2: Implement Scoring

### Goal

Implement board score calculation.

### Files

```text
packages/game-core/src/rules/scoring.ts
```

### Requirements

Implement:

```ts
calculateRowScore(cards: CardInstance[]): number
calculatePlayerScore(player: PlayerState): number
calculateScores(state: GameState): Record<PlayerId, number>
```

### Acceptance Criteria

- Scores use `currentPower`.
- Destroyed cards do not count.
- Tests cover empty board and multi-row board.

---

## Task 2.3: Implement Legal Actions

### Goal

Implement basic legal action generation.

### Files

```text
packages/game-core/src/rules/legalActions.ts
```

### Requirements

Implement:

```ts
getLegalActions(state: GameState, playerId: PlayerId): GameAction[]
```

Basic rules:

- If game status is not `playing`, no play/pass actions.
- If it is not the player's turn, no actions.
- If player has passed, no actions.
- Player may pass.
- Player may play cards from hand.
- Unit cards require a valid row.
- Special cards can be played without a board row unless the card requires target.

### Acceptance Criteria

- Tests cover player turn.
- Tests cover passed player.
- Tests cover unit card play actions.
- Tests cover pass action.

### Avoid

- Do not implement manual targeting yet unless simple.
- Do not implement all effects here.

---

## Task 2.4: Implement Basic Reducer: PLAY_CARD and PASS

### Goal

Implement `applyAction` for playing cards and passing.

### Files

```text
packages/game-core/src/rules/reducer.ts
```

### Requirements

Implement:

```ts
applyAction(state: GameState, action: GameAction): GameState
```

For `PLAY_CARD`:

- Validate action legality.
- Move card from hand to board if unit.
- Move card to graveyard if special.
- Append action log.
- Switch turn if opponent has not passed.
- Keep same active player if opponent has passed.

For `PASS`:

- Set player's `hasPassed = true`.
- Append action log.
- Switch turn if opponent has not passed.
- Trigger round settlement if both players passed.

### Acceptance Criteria

- State is not mutated.
- Playing a unit moves it from hand to board.
- Playing a special moves it from hand to graveyard.
- Passing updates pass state.
- Turn switches correctly.
- Tests cover both actions.

### Avoid

- Do not resolve card effects yet.
- Do not build UI.

---

## Task 2.5: Implement Round Settlement

### Goal

Settle a round when both players pass.

### Files

```text
packages/game-core/src/rules/round.ts
packages/game-core/src/rules/reducer.ts
```

### Requirements

Implement:

```ts
settleRound(state: GameState): GameState
startNextRound(state: GameState): GameState
```

Round settlement should:

- Calculate both scores.
- Determine round winner.
- Increment winner's roundWins.
- Set `roundWinnerId`.
- If a player has 2 round wins, set game status to `game_finished`.
- Otherwise set status to `round_finished`.

Starting next round should:

- Move board cards to graveyard.
- Clear boards.
- Clear pass state.
- Increment round number.
- Set status to `playing`.
- Set next first player.

### Acceptance Criteria

- Round winner is calculated correctly.
- Match ends after two round wins.
- Boards clear when next round starts.
- Graveyards receive board cards.
- Tests cover all cases.

### Avoid

- Do not add complex tie rules unless explicitly requested.
- Default tie behavior can be no round winner.

---

# Phase 3: Card Data and Effect System

## Task 3.1: Add Initial Card Data

### Goal

Add a small initial card pool for testing.

### Files

```text
packages/game-core/src/cards/cardData.ts
```

### Requirements

Add at least:

- 5 Qin cards
- 5 Chu cards
- 5 Qi cards
- 5 Zhao cards

Each card should include:

```ts
id
name
englishName
faction
type
row
power
rarity
tags
effects
budget
description
```

### Acceptance Criteria

- At least 20 cards exist.
- Card ids are unique.
- Cards compile against `CardDefinition`.

### Avoid

- Do not add all 60 cards yet.
- Do not overdesign effects.

---

## Task 3.2: Add Card Validation

### Goal

Validate card definitions at startup/test time.

### Files

```text
packages/game-core/src/cards/cardValidation.ts
```

### Requirements

Implement:

```ts
validateCards(cards: CardDefinition[]): ValidationResult
```

Validation should check:

- Unique ids.
- Unit cards have rows.
- Power is non-negative.
- Known factions.
- Known rows.
- Effects have valid types.
- Warnings for missing budget or description.

### Acceptance Criteria

- Tests detect duplicate ids.
- Tests detect missing row on unit.
- Tests pass for current card data.

---

## Task 3.3: Define Effect Types

### Goal

Define effect type system.

### Files

```text
packages/game-core/src/effects/effectTypes.ts
```

### Required Effects

Implement type definitions for:

```ts
BUFF
DAMAGE
DESTROY
DRAW_DISCARD
SUMMON
REVIVE
LOCK
CLEAR_WEATHER
CONDITIONAL_BOOST
```

Also define:

```ts
TargetSelector
ConditionDefinition
EffectContext
```

### Acceptance Criteria

- `CardDefinition.effects` uses `EffectDefinition`.
- TypeScript compiles.

---

## Task 3.4: Implement Target Resolver

### Goal

Implement target selection for automatic targets.

### Files

```text
packages/game-core/src/effects/targetResolver.ts
```

### Required Target Selectors

Implement:

```ts
SELF
ALLY_LOWEST
ALLY_RANDOM
ALLY_ROW
ENEMY_LOWEST
ENEMY_HIGHEST
ENEMY_RANDOM
ENEMY_ROW
```

### Acceptance Criteria

- Correct targets are returned.
- Destroyed cards are ignored.
- Random target selection uses seeded/context random if available.
- Tests cover lowest, highest, row, and self.

### Avoid

- Manual target UI is not needed yet.
- Do not use Math.random directly.

---

## Task 3.5: Implement Basic Effect Resolver

### Goal

Resolve basic card effects when a card is played.

### Files

```text
packages/game-core/src/effects/effectResolver.ts
packages/game-core/src/rules/reducer.ts
```

### Required Effects First

Implement:

```text
BUFF
DAMAGE
DESTROY
SUMMON
```

Behavior:

- BUFF increases target currentPower.
- DAMAGE decreases target currentPower but not below 0 unless design says otherwise.
- DESTROY marks target as destroyed and moves it to graveyard or excludes it from scoring.
- SUMMON creates token card instance on specified row.

### Acceptance Criteria

- Effects trigger when card is played.
- Tests cover each effect.
- No card-specific hardcoded functions.

### Avoid

- Do not implement draw/discard until next task.
- Do not implement chain reactions.

---

## Task 3.6: Implement Resource Effects

### Goal

Implement draw/discard and revive effects.

### Files

```text
packages/game-core/src/effects/effectResolver.ts
```

### Required Effects

Implement:

```text
DRAW_DISCARD
REVIVE
LOCK
```

Behavior:

- DRAW_DISCARD draws N cards and discards N cards.
- If discard choice is not implemented, use deterministic automatic discard for MVP.
- REVIVE returns an eligible card from graveyard to board or hand based on effect config.
- LOCK disables a unit's skill.

### Acceptance Criteria

- Tests cover draw/discard.
- Tests cover empty deck.
- Tests cover revive with maxPower.
- Tests cover locked cards.

### Avoid

- Do not build discard UI yet.
- Keep automatic discard simple.

---

## Task 3.7: Expand MVP Card Pool to 60 Cards

### Goal

Create the first full MVP card pool.

### Files

```text
packages/game-core/src/cards/cardData.ts
```

### Requirements

Add approximately:

- 15 Qin cards
- 15 Chu cards
- 15 Qi cards
- 15 Zhao cards

Use the product design document for faction identity.

### Acceptance Criteria

- At least 60 cards exist.
- Each faction has at least 12 cards.
- Validation passes.
- No card requires unimplemented effect types.
- Budgets are roughly consistent.

### Avoid

- Do not add Wei/Han/Yan yet.
- Do not add more than 80 cards.

---

# Phase 4: AI and Simulator

## Task 4.1: Implement Simple AI

### Goal

Create a basic AI that can play legal matches.

### Files

```text
packages/game-core/src/ai/simpleAI.ts
```

### Requirements

Implement:

```ts
chooseSimpleAIAction(state: GameState, playerId: PlayerId): GameAction
```

Rules:

- Get legal actions.
- If no legal actions, return pass if possible.
- Prefer playable cards over pass early.
- Can choose a random legal play action.
- Pass when hand is empty.

### Acceptance Criteria

- AI always returns legal action.
- AI can complete a full game.
- Tests cover basic cases.

---

## Task 4.2: Implement Heuristic AI

### Goal

Improve AI enough for MVP playtesting.

### Files

```text
packages/game-core/src/ai/heuristicAI.ts
```

### Requirements

Implement:

```ts
chooseHeuristicAIAction(state: GameState, playerId: PlayerId): GameAction
estimateActionValue(state: GameState, action: GameAction): number
```

Heuristics:

- Prefer actions that improve score difference.
- Pass if ahead and opponent has passed.
- Consider passing if ahead by a large margin.
- Avoid spending high-value cards unnecessarily if already far ahead.

### Acceptance Criteria

- AI is deterministic with seed if randomness is used.
- AI returns legal actions.
- AI can complete a full game.
- Tests cover pass decisions.

---

## Task 4.3: Implement Game Simulation

### Goal

Run AI vs AI matches.

### Files

```text
packages/game-core/src/simulator/simulateGame.ts
```

### Requirements

Implement:

```ts
simulateGame(config: SimulateGameConfig): SimulateGameResult
```

The simulation should:

- Create initial game state.
- Let AI choose actions until game ends.
- Prevent infinite loops with max turn count.
- Return winner, rounds, turns, action log summary.

### Acceptance Criteria

- Simulation completes.
- No infinite loops.
- Result includes winner and stats.
- Tests cover one simulated game.

---

## Task 4.4: Implement Matchup Simulation Report

### Goal

Run many games between factions and output balance stats.

### Files

```text
packages/game-core/src/simulator/simulateMatchup.ts
packages/game-core/src/simulator/report.ts
```

### Requirements

Implement:

```ts
simulateMatchup(config: SimulationConfig): SimulationReport
```

Report should include:

- Number of games.
- Faction A win rate.
- Faction B win rate.
- Draw rate.
- Average rounds.
- Average turns.
- Average final scores.
- Card stats:
  - times drawn
  - times played
  - win rate when played
  - average contribution if available

### Acceptance Criteria

- Can run 1000 games.
- Produces readable report.
- Does not require UI.
- Does not crash with current card pool.

---

# Phase 5: React Web UI

## Task 5.1: Create Basic App Screens

### Goal

Create the high-level app screens.

### Files

```text
apps/web/src/App.tsx
apps/web/src/components/StartScreen.tsx
apps/web/src/components/GameScreen.tsx
apps/web/src/components/ResultScreen.tsx
```

### Requirements

- Start screen lets player choose faction.
- Game screen shows placeholder battle UI.
- Result screen shows match winner.
- Use simple state transitions.

### Acceptance Criteria

- App loads in browser.
- Player can start a game.
- No complex styling required.

---

## Task 5.2: Add Zustand Game Store

### Goal

Connect React UI to game-core.

### Files

```text
apps/web/src/store/gameStore.ts
```

### Requirements

Store should include:

```ts
gameState
selectedCardId
startGame
playCard
pass
startNextRound
restart
```

### Acceptance Criteria

- Store calls game-core functions.
- Store does not duplicate rule logic.
- UI can access gameState.

---

## Task 5.3: Implement Board UI

### Goal

Display both players' boards.

### Files

```text
apps/web/src/components/BoardView.tsx
apps/web/src/components/RowView.tsx
apps/web/src/components/CardView.tsx
```

### Requirements

- Show three rows for each player.
- Show cards in each row.
- Each card displays:
  - English name
  - Current power
  - Short description
- Destroyed cards should not show or should show clearly as destroyed.

### Acceptance Criteria

- Board updates after playing cards.
- Scores match displayed board state.

### Avoid

- Do not add drag-and-drop.
- Do not add complex animations.

---

## Task 5.4: Implement Hand UI and Play Interaction

### Goal

Allow player to play cards by clicking.

### Files

```text
apps/web/src/components/HandView.tsx
apps/web/src/components/CardView.tsx
apps/web/src/components/GameScreen.tsx
```

### Requirements

- Display player's hand.
- Click a card to play it.
- For unit cards, play to its defined row.
- For special cards, resolve immediately.
- Disable hand interaction if it is not player's turn or player has passed.

### Acceptance Criteria

- Player can play cards.
- Hand updates.
- Board updates.
- Turn changes.
- AI response can be triggered after player action.

### Avoid

- Manual target selection can be delayed.
- Use automatic targets for MVP effects.

---

## Task 5.5: Add Pass Button and Round Result Modal

### Goal

Allow player to pass and continue rounds.

### Files

```text
apps/web/src/components/GameScreen.tsx
apps/web/src/components/RoundResultModal.tsx
```

### Requirements

- Add Pass button.
- Show pass state.
- When round ends, show round result.
- Button to start next round.
- When game ends, show result screen.

### Acceptance Criteria

- Player can pass.
- AI can continue after player passes.
- Round settlement is clear.
- Game ends correctly.

---

## Task 5.6: Add Score Panel and Action Log

### Goal

Improve clarity of game state.

### Files

```text
apps/web/src/components/ScorePanel.tsx
apps/web/src/components/ActionLog.tsx
```

### Requirements

Score panel shows:

- Current round.
- Player score.
- Opponent score.
- Round wins.
- Current turn.
- Pass states.

Action log shows recent actions:

- Played card.
- Passed.
- Round result.
- Effects if available.

### Acceptance Criteria

- Player can understand what happened.
- Log updates after each action.

---

## Task 5.7: Add Basic Styling

### Goal

Make the game readable and testable.

### Files

```text
apps/web/src/styles/global.css
```

### Requirements

- Board rows are visually separated.
- Player and opponent areas are clear.
- Cards are readable rectangles.
- Buttons are clear.
- Current turn is visible.

### Acceptance Criteria

- A tester can understand the screen without explanation.
- No need for polished art.

---

# Phase 6: Levels, Tutorial, and Local Save

## Task 6.1: Implement Level Definitions

### Goal

Add static level config.

### Files

```text
packages/game-core/src/campaign/levelTypes.ts
packages/game-core/src/campaign/levelData.ts
```

### Requirements

Define:

```ts
LevelDefinition
TutorialStep
WinCondition
LevelReward
```

Add:

- 5 tutorial levels.
- 10 challenge levels.

### Acceptance Criteria

- Levels compile.
- Each level has enemy faction and deck id.
- Levels are exported.

---

## Task 6.2: Add Level Select Screen

### Goal

Allow player to choose a tutorial/challenge level.

### Files

```text
apps/web/src/components/LevelSelectScreen.tsx
apps/web/src/App.tsx
```

### Requirements

- Show list of levels.
- Show level name and description.
- Start game from selected level.

### Acceptance Criteria

- Player can select level.
- Selected level controls opponent faction/deck.

---

## Task 6.3: Add Local Save

### Goal

Save basic progress locally.

### Files

```text
apps/web/src/store/saveStore.ts
```

### Requirements

Use localStorage to save:

- Completed level ids.
- Settings:
  - language
  - soundEnabled

### Acceptance Criteria

- Completed levels persist after refresh.
- No personal data is stored.

---

## Task 6.4: Add Tutorial Text

### Goal

Teach the game through short tutorial instructions.

### Files

```text
apps/web/src/components/TutorialPanel.tsx
packages/game-core/src/campaign/levelData.ts
```

### Requirements

- Show tutorial text for tutorial levels.
- Keep text short.
- Explain only one concept at a time.

### Acceptance Criteria

- First-time player can understand basic rules.
- Tutorial does not block normal play too much.

---

# Phase 7: Polish, Deployment, and Feedback

## Task 7.1: Add Debug Panel

### Goal

Add a developer-only panel to inspect game state.

### Files

```text
apps/web/src/components/DebugPanel.tsx
```

### Requirements

Debug panel should show:

- Current GameState JSON.
- Current legal actions.
- Button to copy state.
- Optional button to trigger AI action.
- Optional button to restart game with same seed.

### Acceptance Criteria

- Helps debug issues.
- Hidden or collapsed by default.

---

## Task 7.2: Add Simulation CLI Script

### Goal

Allow running simulations from command line.

### Files

```text
packages/game-core/src/simulator/runSimulation.ts
package.json
```

### Requirements

Add script:

```text
npm run simulate
```

The script should run key matchups:

```text
Qin vs Chu
Qin vs Qi
Qin vs Zhao
Chu vs Qi
Chu vs Zhao
Qi vs Zhao
```

Each matchup should run at least 1000 games.

### Acceptance Criteria

- Script prints readable report.
- Script exits successfully.
- No UI dependency.

---

## Task 7.3: Prepare Web Deployment

### Goal

Prepare the app for public Web demo deployment.

### Requirements

- Ensure production build works.
- Add app title.
- Add basic metadata.
- Add version display.
- Add feedback link placeholder.
- Add README instructions.

### Acceptance Criteria

- `npm run build` succeeds.
- App can be deployed to Vercel/Netlify/Cloudflare Pages.
- User can open app and play a match.

---

## Task 7.4: Add Feedback Link

### Goal

Collect user feedback after demo release.

### Requirements

Add a visible feedback link to:

- Google Form
- Tally form
- GitHub issue
- Discord
- Email

Questions to include:

```text
1. Did you understand the rules within 3 minutes?
2. Did you want to play a second match?
3. Which faction felt the most fun?
4. Which card felt unfair?
5. Would you pay $1.99 for a full version?
```

### Acceptance Criteria

- Feedback link is visible.
- Feedback link opens correctly.

---

## Task 7.5: MVP Release Checklist

### Goal

Verify MVP completeness before public sharing.

### Checklist

- [ ] Web app starts.
- [ ] Player can choose faction.
- [ ] Player can play full match against AI.
- [ ] Four factions exist.
- [ ] At least 60 cards exist.
- [ ] At least 10 levels exist.
- [ ] Tutorial exists.
- [ ] Pass works.
- [ ] Round settlement works.
- [ ] Match end works.
- [ ] Scores are visible.
- [ ] Action log is visible.
- [ ] No known crash in normal play.
- [ ] Simulation script works.
- [ ] Feedback link exists.
- [ ] Production build works.

---

# Suggested First Codex Prompt

Use this prompt to start implementation:

```text
Read docs/product_design_document.md, docs/technical_design_document.md, and docs/tasks.md.

Start with Task 0.1 and Task 0.2 only.

Create the initial React + TypeScript + Vite project skeleton and Vitest setup. Keep game logic separate from React. Do not implement gameplay yet. After changes, tell me exactly which files were created and how to run the app and tests.
```

---

# Suggested Follow-Up Prompt After Task 0

```text
Continue with Task 1.1 and Task 1.2 from docs/tasks.md.

Implement the core TypeScript types and constants in the game-core module. Do not implement gameplay logic yet. Add exports from index.ts. Add minimal type compilation checks if useful.
```

---

# Suggested Prompt for Rule Engine

```text
Continue with Task 2.4 from docs/tasks.md.

Implement applyAction for PLAY_CARD and PASS. Keep it pure and independent from React. Add Vitest tests for playing a unit, playing a special card, passing, and turn switching. Do not implement card effects yet.
```

---

# Suggested Prompt for Effect System

```text
Continue with Task 3.5 from docs/tasks.md.

Implement the basic effect resolver for BUFF, DAMAGE, DESTROY, and SUMMON. Use targetResolver. Do not hardcode card-specific functions. Add tests for every effect.
```

---

# Suggested Prompt for Web UI

```text
Continue with Task 5.1 through Task 5.4 from docs/tasks.md.

Implement a minimal React UI that can start a game, display the board, display the hand, and let the player click a card to play it. Do not add drag-and-drop or animations. Keep game rules in game-core.
```

---

# Post-MVP Bug Fixes & UI Enhancements (2026-06-27)

## UI Enhancements: Sidebar Card Preview & Glossary
- **Goal**: Improve card preview usability in battle screen and explain card keywords/mechanics.
- **Changes**:
  - Replaced native browser `title` tooltips with a real-time sidebar panel (`.game-sidebar`).
  - Added hover and focus triggers on Hand cards (`HandView.tsx`) and Board cards (`CardView.tsx`) to set `hoveredCard` state in `useGameStore`.
  - Displayed a detailed card preview frame (showing power, name, faction, row, rarity, type, description) in the sidebar.
  - Added a "Game Terms Glossary" explaining keywords (Lock 封锁, Revive 复活, Special 计策, Summon 召唤, Conditional Boost 条件强化, Power 战力) when no card is hovered.
  - Updated localization files `messages.en.ts` and `messages.zh.ts` with glossary translations.

## Bug Fix: Summon Effect Token Definition Mapping
- **Issue**: Cards with the `SUMMON` effect (e.g. `chu-shaman` summoning `chu-token`) failed to spawn units on the board because token card definitions were missing from `state.cardDefinitions`.
- **Fix**: Modified `createInitialGameState` in `packages/game-core/src/rules/gameInit.ts` to pre-populate `cardDefinitions` with all master card definitions from `INITIAL_CARDS` (including tokens), ensuring the effect resolver can always look up summon targets.

## UI & Save Enhancements: Local Profile Switcher (Save Slots)
- **Goal**: Support multiple offline player profiles on the same device so that players do not overwrite each other's campaign progress and custom decks.
- **Changes**:
  - Upgraded `useSaveStore` in `saveStore.ts` to maintain a list of custom local profiles, mapping custom decks and completed levels to each profile.
  - Added seamless data migration so existing players' single-profile progress is automatically migrated to the "Default Player" profile on launch.
  - Rendered a compact profile switcher select dropdown on the `StartScreen`, complete with a deletion button (🗑) for custom profiles and a text input form to create new profiles.
  - Subscribed `LevelSelectScreen.tsx` reactively to `currentProfileId` and `progress` state changes.
  - Connected `gameStore.ts` deck builder actions (`toggleCardInDeck`, `removeCardFromDeck`, `autoFillDeck`, `selectLevel`) to read and write custom decks from the active profile in `useSaveStore` in real time.



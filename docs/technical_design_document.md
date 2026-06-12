# Technical Design Document: Warring States Card Tactics

## 1. Technical Goals

### 1.1 Project Goal

Build a single-player tactical card game MVP that runs in the browser.

The technical design should support:

- Solo development.
- AI-assisted coding.
- A backend developer with limited frontend experience.
- Clear separation between game logic and UI.
- Config-driven card design.
- Automated balance simulation.
- Future portability to iOS/PWA.
- No backend dependency for MVP.

### 1.2 Technical Principles

1. Game core must be independent from UI.  
   The game logic should not depend on React, browser APIs, DOM, CSS, or localStorage.

2. Game state must be serializable.  
   GameState should be JSON-friendly for debugging, save files, replay, and simulation.

3. All player and AI actions should use Action objects.  
   This enables replay, debugging, testing, and AI simulation.

4. Card effects should be template-driven.  
   Do not write one custom function per card unless absolutely necessary.

5. Rules should be deterministic.  
   Randomness should come from seeded random utilities where possible.

6. MVP should use simple click interactions.  
   Avoid drag-and-drop in the first version.

7. Build Web first.  
   Do not start with iOS, Unity, Godot, or WeChat Mini Program.

---

## 2. Recommended Tech Stack

### 2.1 Frontend

```text
React + TypeScript + Vite
```

Reasons:

- Good AI coding support.
- Fast iteration.
- Easy Web deployment.
- Good fit for state-driven UI.
- TypeScript fits the rule-engine style.
- Can later be wrapped with Capacitor for iOS.

### 2.2 State Management

```text
Zustand
```

Reasons:

- Lighter than Redux.
- Simple API.
- Good enough for a single-player game.
- Easy to connect with a pure game-core package.

### 2.3 Styling

Use either:

```text
Plain CSS
```

or:

```text
Tailwind CSS
```

For a developer with limited Web experience, plain CSS may be easier to reason about. Tailwind can speed up layout but adds another layer to learn.

### 2.4 Testing

```text
Vitest
```

Use it for:

- Rule engine tests.
- Card effect tests.
- Round settlement tests.
- AI tests.
- Simulation tests.

### 2.5 Future Mobile

Possible future stack:

```text
Capacitor
```

Path:

```text
React Web Demo
→ PWA
→ Capacitor iOS
→ TestFlight
→ App Store
```

Do not start with mobile packaging until the Web demo proves the game is fun.

---

## 3. Project Structure

Recommended structure:

```text
warring-card-game/
  package.json
  pnpm-workspace.yaml
  apps/
    web/
      index.html
      package.json
      src/
        main.tsx
        App.tsx
        store/
          gameStore.ts
        components/
          GameScreen.tsx
          StartScreen.tsx
          ResultScreen.tsx
          BoardView.tsx
          RowView.tsx
          HandView.tsx
          CardView.tsx
          ScorePanel.tsx
          ActionLog.tsx
          RoundResultModal.tsx
          DebugPanel.tsx
        styles/
          global.css
  packages/
    game-core/
      package.json
      src/
        types.ts
        constants.ts
        cards/
          cardTypes.ts
          cardData.ts
          cardValidation.ts
        rules/
          gameInit.ts
          actions.ts
          reducer.ts
          scoring.ts
          round.ts
          legalActions.ts
        effects/
          effectTypes.ts
          effectResolver.ts
          targetResolver.ts
        ai/
          aiTypes.ts
          simpleAI.ts
          heuristicAI.ts
        simulator/
          simulateGame.ts
          simulateMatchup.ts
          report.ts
        campaign/
          levelTypes.ts
          levelData.ts
        utils/
          random.ts
          clone.ts
          assertNever.ts
```

If workspace setup feels too heavy at the beginning, start with:

```text
src/
  game-core/
  components/
  store/
  styles/
```

But still keep logic boundaries clean.

---

## 4. Core Data Models

### 4.1 Basic Types

```ts
export type PlayerId = "player" | "opponent";

export type Faction = "qin" | "chu" | "qi" | "zhao" | "neutral";

export type Row = "melee" | "ranged" | "siege";

export type CardType = "unit" | "special" | "weather";

export type Rarity = "common" | "elite" | "hero" | "legend";
```

### 4.2 CardDefinition

A static card definition.

```ts
export interface CardDefinition {
  id: string;
  name: string;
  englishName: string;
  faction: Faction;
  type: CardType;
  row?: Row;
  power: number;
  rarity: Rarity;
  tags: string[];
  effects: EffectDefinition[];
  budget?: number;
  description: string;
}
```

### 4.3 CardInstance

A runtime card instance.

```ts
export interface CardInstance {
  instanceId: string;
  cardId: string;
  ownerId: PlayerId;
  currentPower: number;
  basePower: number;
  isLocked: boolean;
  isDestroyed: boolean;
  modifiers: PowerModifier[];
}
```

### 4.4 PowerModifier

```ts
export interface PowerModifier {
  id: string;
  sourceCardInstanceId?: string;
  amount: number;
  type: "buff" | "damage" | "weather" | "aura";
  expiresAt: "round_end" | "game_end" | "never";
}
```

### 4.5 BoardState

```ts
export interface BoardState {
  melee: CardInstance[];
  ranged: CardInstance[];
  siege: CardInstance[];
}
```

### 4.6 PlayerState

```ts
export interface PlayerState {
  id: PlayerId;
  faction: Faction;
  deck: CardInstance[];
  hand: CardInstance[];
  board: BoardState;
  graveyard: CardInstance[];
  hasPassed: boolean;
  roundWins: number;
}
```

### 4.7 GameState

```ts
export interface GameState {
  id: string;
  seed: string;
  status: "not_started" | "playing" | "round_finished" | "game_finished";
  currentRound: number;
  currentPlayerId: PlayerId;
  players: Record<PlayerId, PlayerState>;
  winnerId?: PlayerId;
  roundWinnerId?: PlayerId;
  actionLog: GameActionLogEntry[];
  weather?: WeatherState;
}
```

---

## 5. Action System

### 5.1 Action Types

All player and AI behavior should be represented as Action objects.

```ts
export type GameAction =
  | PlayCardAction
  | PassAction
  | StartNextRoundAction
  | RestartGameAction;

export interface PlayCardAction {
  type: "PLAY_CARD";
  playerId: PlayerId;
  cardInstanceId: string;
  target?: ActionTarget;
}

export interface PassAction {
  type: "PASS";
  playerId: PlayerId;
}

export interface StartNextRoundAction {
  type: "START_NEXT_ROUND";
}

export interface RestartGameAction {
  type: "RESTART_GAME";
}
```

### 5.2 Reducer Entry

```ts
export function applyAction(
  state: GameState,
  action: GameAction
): GameState {
  // 1. Validate action
  // 2. Execute action
  // 3. Resolve card effects
  // 4. Update round/game state
  // 5. Append action log
  // 6. Return next state
}
```

Rules:

- `applyAction` must be a pure function.
- Do not mutate the input state.
- Do not access React state.
- Do not access DOM.
- Do not access localStorage.
- Do not use uncontrolled random values.

### 5.3 Legal Actions

```ts
export function getLegalActions(
  state: GameState,
  playerId: PlayerId
): GameAction[] {
  // Return all legal actions available to the player.
}
```

Used by:

- UI
- AI
- tests
- debug tools

---

## 6. Effect System

### 6.1 EffectDefinition

```ts
export type EffectDefinition =
  | BuffEffect
  | DamageEffect
  | DestroyEffect
  | DrawDiscardEffect
  | SummonEffect
  | ReviveEffect
  | LockEffect
  | ClearWeatherEffect
  | ConditionalBoostEffect;

export interface BuffEffect {
  type: "BUFF";
  target: TargetSelector;
  amount: number;
}

export interface DamageEffect {
  type: "DAMAGE";
  target: TargetSelector;
  amount: number;
}

export interface DestroyEffect {
  type: "DESTROY";
  target: TargetSelector;
}

export interface DrawDiscardEffect {
  type: "DRAW_DISCARD";
  draw: number;
  discard: number;
}

export interface SummonEffect {
  type: "SUMMON";
  cardId: string;
  row: Row;
  count: number;
}

export interface ReviveEffect {
  type: "REVIVE";
  target: TargetSelector;
  maxPower?: number;
}

export interface LockEffect {
  type: "LOCK";
  target: TargetSelector;
}

export interface ClearWeatherEffect {
  type: "CLEAR_WEATHER";
}

export interface ConditionalBoostEffect {
  type: "CONDITIONAL_BOOST";
  condition: ConditionDefinition;
  amount: number;
}
```

### 6.2 TargetSelector

```ts
export type TargetSelector =
  | { type: "SELF" }
  | { type: "ALLY_LOWEST" }
  | { type: "ALLY_RANDOM"; count: number }
  | { type: "ALLY_ROW"; row: Row }
  | { type: "ENEMY_LOWEST" }
  | { type: "ENEMY_HIGHEST" }
  | { type: "ENEMY_RANDOM"; count: number }
  | { type: "ENEMY_ROW"; row: Row }
  | { type: "MANUAL"; allowed: ManualTargetRule };
```

### 6.3 Effect Resolver

```ts
export function resolveEffects(
  state: GameState,
  sourceCard: CardInstance,
  effects: EffectDefinition[],
  context: EffectContext
): GameState {
  let nextState = state;

  for (const effect of effects) {
    nextState = resolveSingleEffect(nextState, sourceCard, effect, context);
  }

  return nextState;
}
```

Avoid card-specific functions like:

```ts
function baiqiEffect() {}
function sunbinEffect() {}
```

Prefer config:

```ts
{
  type: "DESTROY",
  target: { type: "ENEMY_LOWEST" }
}
```

---

## 7. Game Flow

### 7.1 Game Initialization

```text
1. Select player faction.
2. Build player deck.
3. Build AI deck from level config.
4. Shuffle decks.
5. Draw starting hands.
6. Set currentRound = 1.
7. Set first player.
8. Set status = "playing".
```

### 7.2 Play Card Flow

```text
1. Player selects a card.
2. UI calls getLegalActions.
3. If target is required, UI asks player to select target.
4. UI creates PLAY_CARD action.
5. applyAction executes action.
6. Card moves from hand to board or graveyard.
7. Effects are resolved.
8. Action log is updated.
9. Check if both players passed.
10. If round not over, switch active player.
```

### 7.3 Pass Flow

```text
1. Player clicks Pass.
2. applyAction sets hasPassed = true.
3. If both players passed, round settlement begins.
4. If only one player passed, the other player continues playing.
```

### 7.4 Round Settlement

```text
1. Calculate both player scores.
2. Compare scores.
3. Update roundWins.
4. Move board units to graveyard.
5. Clear temporary effects.
6. Check if a player has won two rounds.
7. If yes, status = "game_finished".
8. If no, status = "round_finished".
```

### 7.5 Scoring

```ts
export function calculatePlayerScore(player: PlayerState): number {
  return (
    sumRow(player.board.melee) +
    sumRow(player.board.ranged) +
    sumRow(player.board.siege)
  );
}
```

---

## 8. AI Design

### 8.1 MVP AI

The MVP AI should be simple and predictable.

AI priorities:

1. Pass if already ahead by enough points.
2. Pass if far behind and hand resources are low.
3. Prefer actions with higher immediate value.
4. Choose best target if effect requires target.
5. Fall back to random legal action.

### 8.2 AI Interface

```ts
export interface AIPlayer {
  chooseAction(state: GameState, playerId: PlayerId): GameAction;
}
```

### 8.3 Action Value Estimation

```ts
export function estimateActionValue(
  state: GameState,
  action: GameAction
): number {
  // Basic implementation:
  // 1. Apply action to a cloned state.
  // 2. Compare score difference before and after.
  // 3. Add or subtract resource value.
}
```

### 8.4 Initial Pass Heuristics

```text
If AI is ahead by >= 12 and the player has not passed, AI may pass.
If AI is ahead by >= 8 and the player has passed, AI should pass.
If AI is behind by >= 15 and has <= 3 cards, AI may pass.
If AI already won one round, it can be more conservative.
```

These values should be adjusted after simulation.

---

## 9. Simulator

### 9.1 Purpose

The simulator helps detect:

- Overpowered factions.
- Overpowered cards.
- Weak cards.
- Bad AI pass behavior.
- Score inflation.
- Bad skill valuation.

### 9.2 Simulation Config

```ts
export interface SimulationConfig {
  factionA: Faction;
  factionB: Faction;
  games: number;
  seed?: string;
}
```

### 9.3 Simulation Report

```ts
export interface SimulationReport {
  games: number;
  factionAWinRate: number;
  factionBWinRate: number;
  drawRate: number;
  averageRounds: number;
  averageTurns: number;
  averageFinalScoreA: number;
  averageFinalScoreB: number;
  cardStats: CardSimulationStats[];
}
```

### 9.4 Card Stats

```ts
export interface CardSimulationStats {
  cardId: string;
  timesDrawn: number;
  timesPlayed: number;
  playRate: number;
  winRateWhenPlayed: number;
  averagePowerContribution: number;
}
```

### 9.5 Balance Targets

| Metric | Target |
|---|---:|
| Faction win rate | 45%-55% |
| Single card win rate | 40%-60% |
| Average match length | 5-10 minutes |
| Average rounds | 2-3 |
| Average turns | 15-30 |

If one faction is above 60% win rate for a long time, nerf it.  
If one card has above 65% win rate when played, inspect it.  
If draw cards dominate, increase their estimated cost.

---

## 10. Frontend UI

### 10.1 Screens

MVP screens:

1. StartScreen  
   Choose faction and start game.

2. GameScreen  
   Main battle UI.

3. ResultScreen  
   Show match result.

4. DebugScreen, optional  
   Developer-only state and simulation tools.

### 10.2 GameScreen Layout

Desktop layout:

```text
Opponent info
Opponent board rows
Score / round / current turn
Player board rows
Player hand
Actions / combat log
```

### 10.3 Components

```text
GameScreen
  ScorePanel
  BoardView
    RowView
      CardView
  HandView
    CardView
  ActionLog
  RoundResultModal
  DebugPanel
```

### 10.4 Interaction

Do not use drag-and-drop in MVP.

Use click-based interaction:

```text
1. Click a hand card.
2. If no target is needed, play it directly or choose row.
3. If target is needed, highlight legal targets.
4. Click target.
5. Dispatch action.
```

### 10.5 Zustand Store

```ts
interface GameStore {
  gameState: GameState | null;
  selectedCardId?: string;
  selectedTarget?: ActionTarget;
  startGame: (faction: Faction) => void;
  playCard: (cardInstanceId: string, target?: ActionTarget) => void;
  pass: () => void;
  startNextRound: () => void;
  restart: () => void;
}
```

The store should call game-core functions.  
The UI should not implement rule logic.

---

## 11. Card Configuration

### 11.1 Example Card

```ts
export const qinCards: CardDefinition[] = [
  {
    id: "qin_infantry",
    name: "秦步卒",
    englishName: "Qin Infantry",
    faction: "qin",
    type: "unit",
    row: "melee",
    power: 5,
    rarity: "common",
    tags: ["soldier"],
    effects: [],
    budget: 5,
    description: "A basic Qin infantry unit."
  },
  {
    id: "qin_baiqi",
    name: "白起",
    englishName: "Bai Qi",
    faction: "qin",
    type: "unit",
    row: "melee",
    power: 9,
    rarity: "legend",
    tags: ["general"],
    effects: [
      {
        type: "DESTROY",
        target: { type: "ENEMY_LOWEST" }
      }
    ],
    budget: 13,
    description: "Deploy: Destroy the enemy's lowest-power unit."
  }
];
```

### 11.2 Card Validation

Validate at startup:

- Unique card ids.
- Valid power.
- Unit cards must have row.
- Special cards may not require row.
- Valid effect types.
- Valid target selectors.
- Budget warnings if estimated value is too far from expected budget.

```ts
export function validateCards(cards: CardDefinition[]): ValidationResult {
  // Return errors and warnings.
}
```

---

## 12. Campaign / Level System

### 12.1 LevelDefinition

```ts
export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  playerFaction: Faction[];
  enemyFaction: Faction;
  enemyDeckId: string;
  playerDeckId?: string;
  tutorialSteps?: TutorialStep[];
  winCondition?: WinCondition;
  rewards?: LevelReward[];
}
```

### 12.2 MVP Levels

Recommended:

- 5 tutorial levels.
- 10 challenge levels.
- Fixed enemy decks.
- No complex branching story.

---

## 13. Local Save

Use localStorage for MVP.

Save:

- Completed levels.
- Settings.
- Sound setting.
- Language setting.
- Optional last game state.

```ts
export interface SaveData {
  completedLevels: string[];
  settings: {
    language: "en" | "zh";
    soundEnabled: boolean;
  };
}
```

Do not store sensitive data.  
No account system is needed.

---

## 14. Testing Strategy

### 14.1 Unit Tests

Test:

- Shuffle and draw.
- Play card.
- Pass.
- Round settlement.
- Best-of-three game end.
- Every skill effect.
- Legal action generation.
- AI action selection.
- Card validation.

### 14.2 Key Test Cases

```text
1. Playing a unit removes it from hand and adds it to board.
2. Passing prevents further play this round.
3. Round ends when both players pass.
4. Game ends when one player wins two rounds.
5. DESTROY ENEMY_LOWEST destroys the correct unit.
6. DRAW_DISCARD changes hand size correctly.
7. LOCK prevents a unit's skill from triggering.
8. REVIVE cannot revive a unit above maxPower.
9. Row score calculation is correct.
10. AI returns only legal actions.
```

### 14.3 Simulation Tests

After card changes, run:

```text
Qin vs Chu: 1000 games
Qin vs Qi: 1000 games
Qin vs Zhao: 1000 games
Chu vs Qi: 1000 games
Chu vs Zhao: 1000 games
Qi vs Zhao: 1000 games
```

Generate reports and track changes.

---

## 15. AI-Assisted Development Workflow

### 15.1 Rule

Do not ask AI to generate the whole game at once.

Work module by module:

1. Types.
2. Game initialization.
3. Reducer.
4. Legal actions.
5. One effect resolver.
6. Tests.
7. AI.
8. Simulator.
9. UI components.

### 15.2 Good Prompt: Rule Engine

```text
Based on the following TypeScript types, implement applyAction.
Requirements:
1. applyAction must be a pure function.
2. Do not depend on React.
3. Do not mutate the input state.
4. Only implement PLAY_CARD and PASS first.
5. Add Vitest tests.
```

### 15.3 Good Prompt: UI Component

```text
Based on this GameState type, write a React BoardView component.
Requirements:
1. Show both players' three board rows.
2. Each card displays englishName, currentPower, and description.
3. Do not include game rules in the component.
4. Call onCardClick(cardInstanceId) when a card is clicked.
5. Use plain CSS.
```

### 15.4 Good Prompt: Effect System

```text
Based on EffectDefinition, implement resolveSingleEffect.
Only implement BUFF, DAMAGE, and DESTROY.
Requirements:
1. Use targetResolver to find targets.
2. Do not mutate the original state.
3. Add tests for each effect.
```

### 15.5 Avoid

Do not:

- Put game rules inside React components.
- Create custom code for each card.
- Add drag-and-drop early.
- Add animations early.
- Add mobile packaging early.
- Skip tests for effects.
- Let AI create a large unreviewed codebase.

---

## 16. Deployment

### 16.1 Web Demo

Recommended platforms:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

For MVP, Vercel or Netlify is easiest.

### 16.2 Public Demo Page

Prepare:

- Game title.
- Short description.
- Screenshot.
- Play button.
- Feedback link.
- Version number.
- Changelog.

### 16.3 Feedback Collection

Use:

- Google Form
- Tally
- Discord invite
- Email list

Suggested questions:

```text
1. Did you understand the rules within 3 minutes?
2. Did you want to play a second match?
3. Which faction felt the most fun?
4. Which card felt unfair?
5. Would you pay $1.99 for a full version?
```

---

## 17. Future Platform Expansion

### 17.1 PWA

Add later:

- manifest.json
- offline cache
- install to home screen
- mobile layout

### 17.2 iOS

Use Capacitor after Web validation.

Required:

- Apple Developer Program
- Xcode
- TestFlight
- App icon
- App screenshots
- Privacy policy
- Support page
- Age rating
- App Store metadata
- Optional IAP configuration

### 17.3 WeChat Mini Program

Not recommended for MVP.

Consider only if:

- Web demo works.
- Chinese audience shows strong interest.
- The game can be simplified for WeChat.
- Regulatory/platform requirements are acceptable.

---

## 18. Technical Risks

### 18.1 Frontend Skill Gap

Risk:

The developer has limited Web experience.

Mitigation:

- Use simple React.
- Use click interactions.
- Avoid drag-and-drop.
- Avoid complex animations.
- Keep UI dumb.
- Keep game-core pure.
- Use AI to generate small UI components.

### 18.2 Rule Complexity

Risk:

Card effects become too complex.

Mitigation:

- Limit MVP to 10-15 effect templates.
- Use effect configs.
- Add tests per effect.
- Avoid chain reactions early.

### 18.3 Balance Difficulty

Risk:

Factions or cards become overpowered.

Mitigation:

- Use card budget system.
- Use simulator.
- Track win rates.
- Price draw, revive, row buff, and destroy effects conservatively.

### 18.4 UI Clarity

Risk:

Players do not understand game state.

Mitigation:

- Always show score.
- Show current round.
- Show current turn.
- Show pass state.
- Show combat log.
- Add tutorial levels.

### 18.5 Scope Creep

Risk:

Project expands into a full game too early.

Mitigation:

- 8-week MVP boundary.
- Four factions only.
- 60 to 80 cards only.
- Single-player only.
- Web only.
- No monetization during MVP.

---

## 19. 8-Week Technical Schedule

### Week 1: Game Core

Deliver:

- Types.
- Game initialization.
- Shuffle/draw.
- Play card.
- Pass.
- Round settlement.
- Match win condition.
- Basic tests.

### Week 2: Card and Effects

Deliver:

- Card config.
- 20 test cards.
- BUFF, DAMAGE, DESTROY, SUMMON.
- targetResolver.
- Card validation.

### Week 3: MVP Card Pool

Deliver:

- Qin cards.
- Chu cards.
- Qi cards.
- Zhao cards.
- 60 cards total.
- 10-12 effect templates.
- English descriptions.

### Week 4: AI and Simulator

Deliver:

- simpleAI.
- heuristicAI v1.
- simulateGame.
- simulateMatchup.
- Simulation report.
- First balance pass.

### Week 5: React Web UI

Deliver:

- StartScreen.
- GameScreen.
- BoardView.
- HandView.
- ScorePanel.
- Pass button.
- ActionLog.

### Week 6: Levels and Tutorial

Deliver:

- LevelDefinition.
- 5 tutorial levels.
- 10 challenge levels.
- Result screen.
- localStorage save.

### Week 7: Polish and Release Prep

Deliver:

- Bug fixes.
- UI clarity improvements.
- Basic responsive layout.
- Web demo page.
- Feedback form.

### Week 8: Public Test

Deliver:

- Public Web demo.
- 20-50 testers.
- Feedback summary.
- Balance report.
- Continue/stop decision.

---

## 20. Definition of Done for MVP

The MVP is done when:

- User can open a public Web link.
- User can select a faction.
- User can play a full best-of-three match against AI.
- At least 4 factions exist.
- At least 60 cards exist.
- At least 10 levels exist.
- Basic tutorial exists.
- All implemented card effects work without crashing.
- Scores and pass states are clear.
- Combat log exists.
- Simulation report can be generated.
- Feedback link exists.

---

## 21. Future Refactor Ideas

If MVP succeeds:

- Split game-core into a clean internal package.
- Add replay system.
- Add card editor.
- Add level editor.
- Add localization system.
- Add mobile UI.
- Add PWA.
- Add Capacitor iOS build.
- Add roguelike campaign.
- Add one-time unlock monetization.

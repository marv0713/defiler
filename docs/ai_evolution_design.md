# AI Evolution Design: Utility AI Roadmap

> **Superpowers note:** This document follows the Superpowers planning style:
> clear architecture, bounded tasks, measurable validation, and TDD-friendly
> implementation steps. It is a design document, not an implementation commit plan.

## Goal

Evolve the current AI from hand-written pass heuristics into a measurable Utility
AI system that can play the MVP card game without dumping its hand in early
rounds, while keeping all game logic inside `packages/game-core`.

The first implementation target is **Normal AI**. Easy AI is not a priority. Hard
AI should build on the same scoring foundation later.

Implementation status as of 2026-06-21:

- Normal Utility AI has been implemented in `packages/game-core/src/ai/normalAI.ts`.
- Shared evaluation helpers live in `packages/game-core/src/ai/aiEvaluation.ts`.
- Web opponent and simulator defaults now use `chooseNormalAIAction`.
- The remaining AI work is tuning, faction-balance analysis, and optional Hard AI
  lookahead.

## Current State

The game currently has:

- `chooseSimpleAIAction`: random legal play-card preference.
- `chooseHeuristicAIAction`: a small set of pass rules plus "play highest
  estimated card value".
- `simulateGame`: AI vs AI single-game simulation.
- `simulateMatchup`: batch matchup report and card stats.
- Player-vs-AI web mode using `chooseNormalAIAction`.

The current Normal-like AI problem is visible in 10-game reports:

- The AI often reaches round 3 with little or no hand.
- Decks are not empty; the problem is early hand over-spending.
- Pass decisions are reactive and rule-like, not based on expected value.
- The AI can keep chasing rounds that are too expensive to win.

## Design Principles

1. **Rules stay in game-core.** React components only call AI functions and
   render outcomes.
2. **AI chooses legal actions only.** All action selection starts from
   `getLegalActions`.
3. **Deterministic by default.** Normal AI should not require randomness.
4. **Score all actions through one interface.** Avoid adding more top-level
   `if shouldPass` rules.
5. **Resource conservation is first-class.** Hand size, round wins, and round
   context must influence scoring.
6. **Use simulation reports as feedback.** AI tuning should be measured by
   matchup reports, not only by isolated unit tests.
7. **No card-specific hardcoding.** Card valuation may inspect generic card
   fields and effect templates, but must not branch on individual card ids.

## Target Architecture

Create a new Normal AI module:

```text
packages/game-core/src/ai/
  normalAI.ts
  normalAI.test.ts
  aiEvaluation.ts
  aiEvaluation.test.ts
```

Recommended public API:

```ts
export interface UtilityAIWeights {
  scoreDiff: number;
  roundWinsDiff: number;
  handAdvantage: number;
  deckAdvantage: number;
  boardUnitAdvantage: number;
  cardResourceCost: number;
  overBudgetPenalty: number;
  hopelessChasePenalty: number;
  opponentPassedLeadBonus: number;
  finalRoundUrgency: number;
}

export interface ActionScoreBreakdown {
  action: GameAction;
  total: number;
  stateDelta: number;
  resourceDelta: number;
  passValue: number;
  cardCost: number;
  budgetPenalty: number;
  chasePenalty: number;
}

export function chooseNormalAIAction(
  state: GameState,
  playerId: PlayerId,
): GameAction;

export function scoreNormalAIAction(
  state: GameState,
  action: GameAction,
  playerId: PlayerId,
  weights?: UtilityAIWeights,
): ActionScoreBreakdown;
```

`chooseHeuristicAIAction` remains as a legacy export. The web app now uses
`chooseNormalAIAction`.

## Utility Evaluation Model

Normal AI should evaluate a game state from one player's perspective:

```text
stateValue =
  scoreDiff * scoreDiffWeight
  + roundWinsDiff * roundWinsWeight
  + handAdvantage * handAdvantageWeight
  + deckAdvantage * deckAdvantageWeight
  + boardUnitAdvantage * boardUnitWeight
```

Suggested starting weights:

```ts
export const NORMAL_AI_WEIGHTS: UtilityAIWeights = {
  scoreDiff: 1,
  roundWinsDiff: 25,
  handAdvantage: 5,
  deckAdvantage: 1,
  boardUnitAdvantage: 1,
  cardResourceCost: 1,
  overBudgetPenalty: 8,
  hopelessChasePenalty: 18,
  opponentPassedLeadBonus: 30,
  finalRoundUrgency: 12,
};
```

These values are tuning defaults, not final balance. The important change is the
shape: hand advantage and round context become part of the same scoring system
as board points.

## Action Scoring

### PLAY_CARD

For each legal `PLAY_CARD` action:

1. Simulate the action with `applyAction`.
2. Compare `evaluateStateForPlayer(nextState)` against
   `evaluateStateForPlayer(state)`.
3. Subtract a resource cost for spending the card.
4. Subtract penalties for over-committing to the current round.
5. Subtract chase penalties when the AI is spending too much to win a round that
   should be abandoned.

High-level formula:

```text
playValue =
  stateValueAfterPlay - stateValueBeforePlay
  - cardResourceCost
  - overBudgetPenalty
  - hopelessChasePenalty
  + finalRoundUrgency
```

Card resource cost should be generic:

```text
cardResourceCost =
  2
  + card.currentPower * 0.35
  + effectTemplateValue * 0.4
  + rarityPremium
```

Suggested rarity premium:

```text
common: 0
elite: 1
hero: 2
legend: 3
```

This prevents the AI from treating a high-impact card as "free" when it is
already ahead.

### PASS

Pass must be scored like an action, not handled as an early special case.

High-level formula:

```text
passValue =
  currentStateValue
  + conservationBonus
  + opponentPassedLeadBonus
  + hopelessChaseBonus
  - roundLossPenalty
  + finalRoundModifier
```

Important pass cases:

- If opponent has passed and AI is ahead, pass should usually win the round.
- If AI is far behind and catching up costs too many cards, pass should be good.
- If AI is slightly behind and can overtake with one low-cost card, pass should
  be bad.
- If it is round 3, pass should be less attractive unless the AI is already
  winning or cannot legally improve.

## Catch-Up Cost

Add a small planner:

```ts
export interface CatchupPlan {
  pointsNeeded: number;
  cardsNeeded: number;
  totalEstimatedCost: number;
  canCatchUp: boolean;
}

export function estimateCatchupPlan(
  state: GameState,
  playerId: PlayerId,
): CatchupPlan;
```

The planner sorts playable hand cards by cheap effective points and asks:

- How many cards are needed to overtake the current score?
- Is the required card count reasonable for this round?
- Is the required cost too high compared with the round's strategic value?

Example behavior:

```text
Behind by 4, one 5-power common in hand:
  canCatchUp = true
  cardsNeeded = 1
  totalEstimatedCost = low
  Normal AI should consider playing.

Behind by 12, best available cards are 5 + 4 + 3:
  canCatchUp = true
  cardsNeeded = 3
  totalEstimatedCost = high
  Normal AI should often pass in round 1 or round 2.
```

This is the main fix for "AI chases a lost round until hand is empty."

## Round Budget

Add round-level resource pressure:

```ts
export interface RoundBudget {
  maxCardsThisRound: number;
  cardsPlayedThisRound: number;
  isOverBudget: boolean;
}

export function getRoundBudget(
  state: GameState,
  playerId: PlayerId,
): RoundBudget;
```

Suggested starting budget:

```text
Round 1:
  max 4 cards

Round 2:
  if AI has one round win: max 3 cards
  if AI has zero round wins and opponent has one: max 6 cards
  otherwise: max 4 cards

Round 3:
  max hand size; spend freely
```

Budget is not a hard rule. It becomes a penalty inside action scoring. The AI
can still exceed budget when the score gain is clearly worth it.

## Difficulty Evolution

### Normal AI

Normal AI is the immediate target:

- Utility scoring for every legal action.
- Catch-up cost estimation.
- Round budget penalty.
- Generic card resource cost.
- Deterministic tie-breaking.

Expected player feel:

- The AI passes earlier in lost rounds.
- The AI preserves cards for round 2 and round 3.
- The AI still makes readable, occasionally imperfect decisions.

### Hard AI

Hard AI should not be a separate rewrite. It should use Normal AI as its base:

```text
Hard score(action) =
  Normal score(action)
  + one-ply opponent response estimate
```

Possible Hard extension:

1. Score each legal action.
2. Apply the candidate action.
3. If the game is still playing, let the opponent choose its best Normal action.
4. Evaluate the resulting state.
5. Choose the action with the best final utility.

This is a 1-ply lookahead, not full minimax. It is enough for a stronger AI
without exploding complexity.

## Simulation Metrics

The simulator should be used after every AI tuning change.

Baseline metrics to inspect:

```text
games
win rates by faction
average rounds
average turns
average final scores
stoppedByMaxTurns
card timesDrawn / timesPlayed
winRateWhenPlayed
averageContribution
```

Add these metrics before serious tuning:

```text
average final hand size by player/faction
average cards played per round
average passes per round
round winner distribution
round score history
```

These metrics reveal whether the AI improved for the right reason. A higher win
rate alone is not enough; the AI should also preserve cards and create more
interesting round tension.

## Acceptance Criteria For Normal AI

Unit-level behavior:

- Returns only legal actions.
- Deterministic for the same state.
- Passes when ahead and opponent has passed.
- Passes when behind by too much and catch-up cost is high.
- Plays when slightly behind and one cheap card can overtake.
- Penalizes high-value cards when already ahead in non-final rounds.
- Is more willing to spend cards in round 3.

Simulation-level behavior:

- `simulateMatchup` can run 1000 games without max-turn stops.
- In a 100-game Qin vs Chu report, average final hand size should not collapse
  near zero for both sides.
- Average cards played in round 1 should be materially lower than the current
  "dump most of the opening hand" behavior.
- Faction win rate should be inspected, but not forced to 50/50 during AI work.
  Some imbalance may come from card data rather than AI.

Suggested validation commands:

```bash
pnpm --filter @warring-states/game-core test -- src/ai/normalAI.test.ts src/ai/aiEvaluation.test.ts
pnpm --filter @warring-states/game-core test -- src/simulator/simulateMatchup.test.ts src/simulator/report.test.ts
pnpm test
pnpm typecheck
pnpm build
```

## Implementation Phases

### Phase A: Evaluation Helpers

Create `aiEvaluation.ts` with:

- `getOpponentId`
- `countBoardUnits`
- `countCardsPlayedThisRound`
- `evaluateStateForPlayer`
- `estimateCardResourceCost`
- `estimateCatchupPlan`
- `getRoundBudget`

Tests should build small deterministic states and verify each helper.

### Phase B: Normal Action Scoring

Create `normalAI.ts` with:

- `scoreNormalAIAction`
- `chooseNormalAIAction`
- deterministic tie-breaking

Tie-breaking order:

1. Higher score.
2. PASS over PLAY_CARD when scores are effectively equal and AI is ahead.
3. Lower card resource cost.
4. Earlier legal action order.

### Phase C: Web Integration

Change `apps/web/src/store/gameStore.ts` to call `chooseNormalAIAction`.

Do not move AI rules into React. The store should remain a caller only.

### Phase D: Simulator Feedback

Use `simulateMatchup` to compare:

```text
Current heuristic AI
Normal Utility AI
```

Record at least:

- 10-game quick report for manual inspection.
- 100-game report for less noisy behavior.
- Any obvious faction skew.
- Average hand-size and per-round card-spend metrics once those are added.

### Phase E: Documentation

Update:

- `progress.md`: implementation facts and verification commands.
- `findings.md`: final scoring formulas, known limitations, and report results.
- `task_plan.md`: mark AI tuning step complete or note the next tuning target.

## Known Limitations

- Utility AI still depends on weights. Bad weights can still produce bad play.
- Current contribution stats attribute only `currentPower`, not effect side
  effects.
- Hidden information is not modeled; both AI players effectively use the public
  game state available in `GameState`.
- One-ply Hard AI will still need the Normal evaluation function; search alone
  does not replace state evaluation.
- Some poor outcomes may be card-pool imbalance, not AI behavior. Simulator
  reports should separate "AI spends badly" from "faction is weak."

## Decision

Proceed with Normal Utility AI before Hard AI.

Do not add Easy AI work unless a future tutorial needs intentionally weak
behavior. The current priority is making the default single-player opponent feel
strategic, resource-aware, and readable.

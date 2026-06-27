# Pluggable AI Strategy Design

## Goal

Make opponent AI easy to replace, compare, and tune without putting gameplay
logic in React. Implement three AI approaches behind one game-core interface,
then benchmark them against each other before choosing the campaign default.

The user-facing problem is clear: the game is playable, but PvE still feels too
weak. The likely cause is not merely bad weights. The current AI mostly scores
individual actions; it does not have a strong strategic layer for three-round
resource play.

## Constraints

- Keep all AI and gameplay logic in `packages/game-core`.
- React/Zustand may select an AI id, but must not contain game rules.
- AI must only return legal actions from `getLegalActions`.
- AI behavior must be deterministic for a given game state and seed.
- Do not hardcode one function per card.
- Card role analysis must derive from generic card definition fields and effect
  configs.
- Add Vitest tests for AI behavior and benchmark plumbing.

## Current AI Baseline

Current campaign AI uses `chooseNormalAIAction(state, playerId, weights)`.
Difficulty 1-2 uses Easy weights, difficulty 3 uses Normal weights, and
difficulty 4-5 uses Hard weights.

This is useful but fragile:

- Weight tuning mixes strategic concerns with tactical action scoring.
- A high hand-resource weight can make AI pass too much.
- A low resource weight can make AI dump its hand.
- The current Hard path has a small one-ply opponent-response branch embedded
  inside `chooseNormalAIAction`, which makes the chooser harder to swap.

## Target Architecture

Add a small AI strategy interface in game-core:

```ts
export type AIId =
  | "utility-v1"
  | "round-strategy"
  | "lookahead-1ply";

export interface AIContext {
  state: GameState;
  playerId: PlayerId;
  weights?: UtilityAIWeights;
}

export interface AIStrategy {
  id: AIId;
  label: string;
  chooseAction(context: AIContext): GameAction;
}

export function chooseAIAction(
  context: AIContext & { aiId?: AIId },
): GameAction;

export function getAIStrategy(aiId: AIId): AIStrategy;
```

The old public API stays compatible:

```ts
export function chooseNormalAIAction(
  state: GameState,
  playerId: PlayerId,
  weights?: UtilityAIWeights,
): GameAction;
```

Internally, `chooseNormalAIAction` should call `chooseAIAction` with the
current default id. This keeps existing tests and callers stable while allowing
web and simulator code to choose other AI ids.

## Three AI Implementations

### 1. Utility V1

This is the current Utility AI moved behind the `AIStrategy` interface.

Purpose:

- Preserve a known baseline.
- Make future regressions obvious.
- Keep a simple, fast AI available for comparison.

Behavior:

- Score each legal action with `scoreNormalAIAction`.
- Use the existing tie-break rules.
- Do not add new strategic gates.

### 2. Round Strategy AI

This is the recommended candidate for campaign PvE.

It adds a strategic planning layer before tactical action scoring.

```ts
export type RoundPlan =
  | "concede_round"
  | "cheap_catchup"
  | "contest_round"
  | "bleed_opponent"
  | "must_win"
  | "final_all_in";

export interface RoundContext {
  round: number;
  scoreLead: number;
  playerRoundWins: number;
  opponentRoundWins: number;
  opponentPassed: boolean;
  handAdvantage: number;
  catchup: CatchupPlan;
  canWinMatchThisRound: boolean;
  mustWinRound: boolean;
}
```

Plan selection examples:

- If round 1 is expensive to catch up and AI has not lost a round yet:
  `concede_round`.
- If opponent has passed and AI can overtake with one low-cost card:
  `cheap_catchup`.
- If AI won round 1 and it is round 2:
  `bleed_opponent`, but with a strict spend cap.
- If AI lost round 1 and it is round 2:
  `must_win`.
- If round 3:
  `final_all_in`.

Tactical selection then filters or biases legal actions:

- `concede_round`: prefer pass unless already ahead.
- `cheap_catchup`: choose the lowest resource-cost play that overtakes the
  current score; avoid legends/heroes if a common or elite card is sufficient.
- `contest_round`: use Utility scoring with normal budget limits.
- `bleed_opponent`: play efficient low/mid cards, avoid finishers unless they
  secure the match.
- `must_win`: lower resource penalties, but still avoid overkill if opponent
  has already passed.
- `final_all_in`: heavily favor immediate score swing and legal plays over hand
  conservation.

### 3. Lookahead 1-Ply AI

This AI evaluates each legal action, predicts one opponent response, and scores
the resulting future state. It is a heavier but still bounded alternative to
pure Utility scoring.

Purpose:

- Measure whether shallow search improves play enough to justify complexity.
- Make the current hard-mode special case a first-class interchangeable AI.

Behavior:

- For each legal AI action:
  - Apply the action.
  - If the game/round ends, score that state.
  - Otherwise choose an opponent response using Utility V1.
  - Apply the response.
  - Score the future state plus original resource delta.
- Return the highest scoring action.

Limits:

- One-ply only for 8.1.
- No hidden-card inference.
- No tree search, no MCTS, no async work.

## Generic Card Role Analysis

Add generic card classification for strategy use:

```ts
export type CardRole =
  | "filler"
  | "tempo"
  | "removal"
  | "row_buff"
  | "setup"
  | "finisher"
  | "resource";

export function classifyCardRoles(definition: CardDefinition): Set<CardRole>;
```

Role derivation examples:

- `DAMAGE`, `DESTROY`, `LOCK` => `removal`
- `BUFF` with `ALLY_ROW` => `row_buff`
- `SUMMON` => `setup`
- `DRAW_DISCARD`, `REVIVE` => `resource`
- `CONDITIONAL_BOOST` with score/round-dependent condition => `finisher`
- high power or legend/hero rarity => `finisher`
- low power no-effect cards => `filler`

No card id should appear in this logic.

## Benchmark and Comparison

Add a benchmark helper that can compare two AI ids over deterministic games:

```ts
export interface AIComparisonConfig {
  seed: string;
  games: number;
  aiA: AIId;
  aiB: AIId;
  factionA: Faction;
  factionB: Faction;
  weightsA?: UtilityAIWeights;
  weightsB?: UtilityAIWeights;
}
```

Metrics:

- win rate by AI id
- completed games and max-turn stops
- average turns and rounds
- average final score
- average hand size at start of round 2
- average hand size at start of round 3
- empty-hand losses
- passes while ahead
- plays after opponent passed

Acceptance for 8.1 is not "new AI must always win". Acceptance is:

- all three AI implementations run through the same interface;
- the benchmark produces readable comparison output;
- tests demonstrate the Round Strategy AI fixes known weak behaviors;
- campaign can select the stronger default without touching React gameplay
  logic.

## Campaign Integration

For 8.1, campaign should default to `round-strategy` for difficulty 3-5 and may
keep `utility-v1` for difficulty 1-2 if early levels should remain gentle.

Suggested mapping:

```ts
export function getCampaignAIIdForDifficulty(difficulty: number): AIId {
  if (difficulty <= 2) return "utility-v1";
  if (difficulty === 3) return "round-strategy";
  return "lookahead-1ply";
}
```

This mapping is deliberately centralized in game-core or store glue, not inside
React components.

## Non-Goals

- No online AI service.
- No neural network.
- No MCTS.
- No hidden-hand opponent modelling in 8.1.
- No UI settings screen for selecting AI.
- No card-id-specific strategy table.

## Risks

- Lookahead can become slow if expanded beyond one response. Keep it one-ply.
- Strategy rules can become another hard-to-tune heuristic pile. Keep plans
  few, named, and tested.
- Benchmarks can overfit AI-vs-AI behavior. Use them for direction, then verify
  by playing campaign manually.

## Done Criteria

- Spec and plan are written under `docs/`.
- `task_plan.md`, `progress.md`, and `findings.md` mark Phase 8 / Task 8.1 as
  planned before implementation starts.
- Implementation creates pluggable AI strategy APIs.
- Utility V1, Round Strategy, and Lookahead 1-Ply are all available strategies.
- Simulator can compare AI strategies.
- Tests cover interface routing, known behavior fixes, and benchmark output.
- `npm test` and `npm run build` pass after implementation.

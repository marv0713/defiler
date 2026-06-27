# Strategic 3-Ply Lookahead AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Strategic 3-Ply Lookahead AI (`lookahead-3ply`) for campaign difficulty 4-5 that makes tactical decisions based on 3-step minimax search, avoids early concessions in survival rounds, and conserves high-rarity cards (Legend/Hero) for the final round.

**Architecture:** 
1. Add `isSurvivalRound` and hand quality evaluation (valuing elite/hero/legend cards in hand in rounds 1-2) to `packages/game-core/src/ai/aiEvaluation.ts`.
2. Disable hopeless chase and over-budget limits in survival rounds in `packages/game-core/src/ai/normalAI.ts`, and forbid passing when behind.
3. Implement `chooseLookahead3PlyAIAction` in `packages/game-core/src/ai/lookaheadAI.ts` using 3-ply minimax (AI -> Opponent -> AI) with opponent response pruning (top 2 moves).
4. Register the new strategy in `aiStrategy.ts` and map campaign difficulty 4-5 to it in `gameStore.ts`.

**Tech Stack:** TypeScript, React, Zustand, Vitest.

---

## File Structure

- Modify: `packages/game-core/src/ai/aiEvaluation.ts`
  - Implement `isSurvivalRound` and card quality retention in state evaluation.
  - Update `getRoundBudget` to make the budget infinite in survival rounds.
- Modify: `packages/game-core/src/ai/normalAI.ts`
  - Overwrite hopeless chase in survival rounds and prevent passing when behind.
- Modify: `packages/game-core/src/ai/lookaheadAI.ts`
  - Implement `chooseLookahead3PlyAIAction` and minimax evaluation helper.
- Modify: `packages/game-core/src/ai/aiStrategy.ts`
  - Add `lookahead-3ply` ID and strategy registration.
- Modify: `packages/game-core/src/index.ts`
  - Export `chooseLookahead3PlyAIAction` and `isSurvivalRound`.
- Modify: `apps/web/src/store/gameStore.ts`
  - Update campaign difficulty mapping for 4-5 to `lookahead-3ply`.
- Create: `packages/game-core/src/ai/lookaheadAI.test.ts`
  - Add unit tests for 3-ply tactical sequencing and survival round persistence.
- Modify: `packages/game-core/src/ai/aiBenchmark.test.ts`
  - Benchmark `lookahead-3ply` against `utility-v1` to verify superior win rate.

---

### Task 1: Update AI Evaluation for Survival Rounds and Hand Quality

**Files:**
- Modify: `packages/game-core/src/ai/aiEvaluation.ts`

- [ ] **Step 1: Implement isSurvivalRound, card retention, and budget overrides in aiEvaluation.ts**

Replace `evaluateStateForPlayer` and `getRoundBudget` in `packages/game-core/src/ai/aiEvaluation.ts` and add `isSurvivalRound`.

```typescript
export function isSurvivalRound(state: GameState, playerId: PlayerId): boolean {
  const opponentId = getOpponentId(playerId);
  return (
    state.players[opponentId].roundWins === 1 &&
    state.players[playerId].roundWins === 0
  );
}

export function evaluateStateForPlayer(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): number {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const player = state.players[playerId];
  const opponent = state.players[opponentId];

  const scoreDiff = scores[playerId] - scores[opponentId];
  const roundWinsDiff = player.roundWins - opponent.roundWins;
  const handAdvantage = player.hand.length - opponent.hand.length;
  const deckAdvantage = player.deck.length - opponent.deck.length;
  const boardUnitAdvantage =
    countBoardUnits(state, playerId) - countBoardUnits(state, opponentId);

  let score =
    scoreDiff * weights.scoreDiff +
    roundWinsDiff * weights.roundWinsDiff +
    handAdvantage * weights.handAdvantage +
    deckAdvantage * weights.deckAdvantage +
    boardUnitAdvantage * weights.boardUnitAdvantage;

  // Hand quality premium (encourage keeping elite/hero/legend cards in early rounds)
  if (state.currentRound < 3 && !isSurvivalRound(state, playerId)) {
    // Player hand quality
    for (const handCard of player.hand) {
      const def = state.cardDefinitions[handCard.cardId];
      if (!def) continue;
      let premium = 0;
      if (def.rarity === "elite") premium = 1.0;
      else if (def.rarity === "hero") premium = 3.0;
      else if (def.rarity === "legend") premium = 6.0;
      score += premium * (weights.handAdvantage * 0.4);
    }
    // Opponent hand quality (minimize opponent's quality, so subtract it)
    for (const handCard of opponent.hand) {
      const def = state.cardDefinitions[handCard.cardId];
      if (!def) continue;
      let premium = 0;
      if (def.rarity === "elite") premium = 1.0;
      else if (def.rarity === "hero") premium = 3.0;
      else if (def.rarity === "legend") premium = 6.0;
      score -= premium * (weights.handAdvantage * 0.4);
    }
  }

  // Kill Shot penalty/bonus (graveyard isDestroyed cards + board units with 0 or less power).
  const countDeadOrDestroyed = (pState: typeof player) => {
    const graveyardCount = pState.graveyard.filter((c) => c.isDestroyed).length;
    const boardCount = [
      ...pState.board.melee,
      ...pState.board.ranged,
      ...pState.board.siege,
    ].filter((c) => c.currentPower <= 0).length;
    return graveyardCount + boardCount;
  };
  const playerDestroyed = countDeadOrDestroyed(player);
  const opponentDestroyed = countDeadOrDestroyed(opponent);
  score += (opponentDestroyed - playerDestroyed) * (weights.killShotBonus ?? 0);

  // Row-buff hand synergy bonus.
  if (weights.synergyBonusScale && weights.synergyBonusScale > 0) {
    for (const handCard of player.hand) {
      const def = state.cardDefinitions[handCard.cardId];
      if (!def) continue;
      for (const effect of def.effects) {
        if (effect.type === "BUFF" && effect.target.type === "ALLY_ROW") {
          const row = effect.target.row;
          const rowCount = player.board[row].filter((c) => !c.isDestroyed).length;
          score += rowCount * effect.amount * weights.synergyBonusScale;
        }
      }
    }
  }

  return score;
}

export function getRoundBudget(
  state: GameState,
  playerId: PlayerId,
): RoundBudget {
  const opponentId = getOpponentId(playerId);
  const playerWins = state.players[playerId].roundWins;
  const opponentWins = state.players[opponentId].roundWins;
  const cardsPlayedThisRound = countCardsPlayedThisRound(state, playerId);

  let maxCardsThisRound = 4;
  if (state.currentRound >= 3) {
    maxCardsThisRound = cardsPlayedThisRound + state.players[playerId].hand.length;
  } else if (state.currentRound === 2 && playerWins > opponentWins) {
    maxCardsThisRound = 3;
  } else if (state.currentRound === 2 && playerWins < opponentWins) {
    // Survival round: spend freely to survive
    maxCardsThisRound = cardsPlayedThisRound + state.players[playerId].hand.length;
  }

  return {
    maxCardsThisRound,
    cardsPlayedThisRound,
    isOverBudget: cardsPlayedThisRound >= maxCardsThisRound,
  };
}
```

- [ ] **Step 2: Run test suite to verify no compile errors**

Run:
```bash
pnpm --filter @warring-states/game-core test src/ai/aiEvaluation.test.ts
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add packages/game-core/src/ai/aiEvaluation.ts
git commit -m "feat(ai): implement survival round and hand quality evaluations"
```

---

## Task 2: Disable Concessions in Survival Rounds

**Files:**
- Modify: `packages/game-core/src/ai/normalAI.ts`

- [ ] **Step 1: Update isHopelessChase and scorePassAction**

Modify `isHopelessChase` and `scorePassAction` in `packages/game-core/src/ai/normalAI.ts` to skip penalties and prevent passing when losing in survival rounds.

```typescript
function isHopelessChase(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights,
): boolean {
  if (state.currentRound >= 3) return false;
  if (isSurvivalRound(state, playerId)) return false;

  const catchup = estimateCatchupPlan(state, playerId);
  if (catchup.pointsNeeded === 0) return false;
  if (!catchup.canCatchUp) return true;

  const opponentId = getOpponentId(playerId);
  const opponentPassed = state.players[opponentId].hasPassed;

  if (opponentPassed) {
    const isRound1 = state.currentRound === 1;
    if (isRound1) {
      // In Round 1, only chase if it requires at most 2 cards.
      return catchup.cardsNeeded > Math.min(2, state.players[playerId].hand.length);
    } else {
      // In Round 2, if we can win the match or must win the round to stay alive, chase if we have cards.
      return catchup.cardsNeeded > state.players[playerId].hand.length;
    }
  }

  const budget = getRoundBudget(state, playerId);
  const remainingBudget = Math.max(
    0,
    budget.maxCardsThisRound - budget.cardsPlayedThisRound,
  );

  return (
    catchup.cardsNeeded > Math.max(1, remainingBudget) ||
    catchup.totalEstimatedCost >= weights.hopelessChasePenalty
  );
}

function scorePassAction(
  state: GameState,
  action: GameAction,
  playerId: PlayerId,
  weights: UtilityAIWeights,
): ActionScoreBreakdown {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const lead = scores[playerId] - scores[opponentId];
  const opponentPassed = state.players[opponentId].hasPassed;
  const catchup = estimateCatchupPlan(state, playerId);
  const budget = getRoundBudget(state, playerId);

  // Survival round check: never pass when losing if we still have cards in hand!
  if (isSurvivalRound(state, playerId) && lead <= 0 && state.players[playerId].hand.length > 0) {
    return {
      action,
      total: Number.NEGATIVE_INFINITY,
      stateDelta: 0,
      resourceDelta: 0,
      passValue: Number.NEGATIVE_INFINITY,
      cardCost: 0,
      budgetPenalty: 0,
      chasePenalty: 0,
    };
  }

  let passValue = 0;

  if (opponentPassed && lead > 0) {
    passValue += weights.opponentPassedLeadBonus + lead;
  }

  const hopelessChase = isHopelessChase(state, playerId, weights);

  if (hopelessChase) {
    passValue += weights.hopelessChasePenalty;
  }

  if (lead > 0 && state.currentRound < 3) {
    passValue += Math.min(12, lead);
  }

  if (budget.isOverBudget && state.currentRound < 3) {
    passValue += weights.overBudgetPenalty * 2;
  }

  if (
    lead <= 0 &&
    catchup.canCatchUp &&
    catchup.cardsNeeded <= 1 &&
    !(budget.isOverBudget && state.currentRound < 3)
  ) {
    passValue -= 25;
  }

  if (lead < 0 && !hopelessChase && state.currentRound < 3) {
    passValue -= 12;
  }

  if (lead < 0 && state.currentRound >= 3) {
    passValue -= weights.finalRoundUrgency * 2;
  }

  if (countBoardUnits(state, playerId) === 0 && lead >= 0 && state.currentRound < 3) {
    passValue -= 10;
  }

  return {
    action,
    total: passValue,
    stateDelta: 0,
    resourceDelta: 0,
    passValue,
    cardCost: 0,
    budgetPenalty: 0,
    chasePenalty: 0,
  };
}
```

- [ ] **Step 2: Run tests to verify normalAI behaves correctly**

Run:
```bash
pnpm --filter @warring-states/game-core test src/ai/normalAI.test.ts
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add packages/game-core/src/ai/normalAI.ts
git commit -m "feat(ai): prevent survival round concessions in normal action scoring"
```

---

## Task 3: Implement 3-Ply Lookahead AI

**Files:**
- Modify: `packages/game-core/src/ai/lookaheadAI.ts`

- [ ] **Step 1: Implement chooseLookahead3PlyAIAction in lookaheadAI.ts**

Append `chooseLookahead3PlyAIAction` and the evaluation helper `evaluate3PlyMoves` to `packages/game-core/src/ai/lookaheadAI.ts`.

```typescript
export function chooseLookahead3PlyAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  if (legalActions.length === 0) return { type: "PASS", playerId };

  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const lead = scores[playerId] - scores[opponentId];
  const isSurvival = isSurvivalRound(state, playerId);

  if (isSurvival && lead <= 0 && state.players[playerId].hand.length > 0) {
    const playActions = legalActions.filter((action) => action.type !== "PASS");
    if (playActions.length > 0) {
      return evaluate3PlyMoves(state, playerId, playActions, weights);
    }
  }

  return evaluate3PlyMoves(state, playerId, legalActions, weights);
}

function evaluate3PlyMoves(
  state: GameState,
  playerId: PlayerId,
  actions: GameAction[],
  weights: UtilityAIWeights,
): GameAction {
  const before = evaluateStateForPlayer(state, playerId, weights);
  let bestAction = actions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const action of actions) {
    try {
      const immediate = scoreNormalAIAction(state, action, playerId, weights);
      if (immediate.total === Number.NEGATIVE_INFINITY) continue;

      const afterAI = applyAction(state, action);
      let score = 0;

      if (afterAI.status !== "playing") {
        score = evaluateStateForPlayer(afterAI, playerId, weights) - before + immediate.resourceDelta;
      } else {
        const opponentId = getOpponentId(playerId);
        const opponentActions = getLegalActions(afterAI, opponentId);
        
        if (opponentActions.length === 0) {
          score = evaluateStateForPlayer(afterAI, playerId, weights) - before + immediate.resourceDelta;
        } else {
          // Sort opponent responses using 1-ply utility score from opponent's perspective,
          // then choose the top 2 responses to simulate deeper.
          const opponentScored = opponentActions.map((opAction) => {
            const opImmediate = scoreNormalAIAction(afterAI, opAction, opponentId, weights);
            return { action: opAction, score: opImmediate.total };
          }).filter((x) => x.score !== Number.NEGATIVE_INFINITY)
            .sort((a, b) => b.score - a.score);

          if (opponentScored.length === 0) {
            score = evaluateStateForPlayer(afterAI, playerId, weights) - before + immediate.resourceDelta;
          } else {
            const topOpponentMoves = opponentScored.slice(0, 2);
            let minScoreForAI = Number.POSITIVE_INFINITY;

            for (const opMove of topOpponentMoves) {
              const afterOpponent = applyAction(afterAI, opMove.action);
              let bestAIResponseScore = Number.NEGATIVE_INFINITY;

              if (afterOpponent.status !== "playing") {
                bestAIResponseScore = evaluateStateForPlayer(afterOpponent, playerId, weights) - before + immediate.resourceDelta;
              } else {
                // AI's turn to counter-play (Step 3)
                const aiResponses = getLegalActions(afterOpponent, playerId);
                if (aiResponses.length === 0) {
                  bestAIResponseScore = evaluateStateForPlayer(afterOpponent, playerId, weights) - before + immediate.resourceDelta;
                } else {
                  for (const aiResp of aiResponses) {
                    const aiRespImmediate = scoreNormalAIAction(afterOpponent, aiResp, playerId, weights);
                    if (aiRespImmediate.total === Number.NEGATIVE_INFINITY) continue;

                    const projected = applyAction(afterOpponent, aiResp);
                    const respScore = evaluateStateForPlayer(projected, playerId, weights) - before + immediate.resourceDelta;
                    if (respScore > bestAIResponseScore) {
                      bestAIResponseScore = respScore;
                    }
                  }
                }
              }

              if (bestAIResponseScore < minScoreForAI) {
                minScoreForAI = bestAIResponseScore;
              }
            }

            score = minScoreForAI;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    } catch {
      // Ignore invalid projected branches
    }
  }

  return bestAction;
}
```

- [ ] **Step 2: Run build to ensure lookaheadAI.ts compiles cleanly**

Run:
```bash
pnpm --filter @warring-states/game-core build
```
Expected: Compilation succeeds.

- [ ] **Step 3: Commit**
```bash
git add packages/game-core/src/ai/lookaheadAI.ts
git commit -m "feat(ai): implement chooseLookahead3PlyAIAction"
```

---

## Task 4: Register and Export 3-Ply Strategy

**Files:**
- Modify: `packages/game-core/src/ai/aiStrategy.ts`
- Modify: `packages/game-core/src/index.ts`

- [ ] **Step 1: Register lookahead-3ply in aiStrategy.ts**

Update `AIId` type and `STRATEGIES` registry in `packages/game-core/src/ai/aiStrategy.ts` to include `lookahead-3ply`.

```typescript
import { chooseLookahead3PlyAIAction } from "./lookaheadAI";

export type AIId = "utility-v1" | "round-strategy" | "lookahead-1ply" | "lookahead-3ply";

const lookahead3PlyStrategy: AIStrategy = {
  id: "lookahead-3ply",
  label: "Lookahead 3-Ply",
  chooseAction: ({ state, playerId, weights }) =>
    chooseLookahead3PlyAIAction(state, playerId, weights),
};

const STRATEGIES: Record<AIId, AIStrategy> = {
  "utility-v1": utilityV1Strategy,
  "round-strategy": roundStrategy,
  "lookahead-1ply": lookahead1PlyStrategy,
  "lookahead-3ply": lookahead3PlyStrategy,
};
```

- [ ] **Step 2: Export from packages/game-core/src/index.ts**

Add exports in `packages/game-core/src/index.ts`.

```typescript
export { chooseLookahead3PlyAIAction } from "./ai/lookaheadAI";
export { isSurvivalRound } from "./ai/aiEvaluation";
```

- [ ] **Step 3: Commit**
```bash
git add packages/game-core/src/ai/aiStrategy.ts packages/game-core/src/index.ts
git commit -m "feat(ai): register and export lookahead-3ply strategy"
```

---

## Task 5: Integrate lookahead-3ply in gameStore campaign mapping

**Files:**
- Modify: `apps/web/src/store/gameStore.ts`

- [ ] **Step 1: Map campaign difficulty 4-5 to lookahead-3ply in gameStore.ts**

Replace the implementation of `getCampaignAIIdForDifficulty` in `apps/web/src/store/gameStore.ts`.

```typescript
function getCampaignAIIdForDifficulty(difficulty: number): AIId {
  if (difficulty <= 2) return "utility-v1";
  if (difficulty === 3) return "round-strategy";
  return "lookahead-3ply";
}
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/src/store/gameStore.ts
git commit -m "feat(ai): map campaign difficulty 4-5 to lookahead-3ply"
```

---

## Task 6: Add Tests for 3-Ply Lookahead and Survival Rounds

**Files:**
- Create: `packages/game-core/src/ai/lookaheadAI.test.ts`

- [ ] **Step 1: Create lookaheadAI.test.ts with targeted behaviors**

Write tests checking:
1. `chooseLookahead3PlyAIAction` chooses to play a card instead of passing when in a survival round and losing.
2. It prefers playing regular units over a legendary finisher in Round 1 if the score lead is not critical.

```typescript
import { describe, expect, test } from "vitest";
import { makeTestCard, makeTestPlayer, makeTestState } from "./aiTestHelpers";
import { chooseLookahead3PlyAIAction } from "./lookaheadAI";
import { HARD_AI_WEIGHTS } from "./aiEvaluation";

describe("Strategic 3-Ply Lookahead AI", () => {
  test("never passes in a survival round (down 0-1) if losing and has cards in hand", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 10, "player")], false, 1),
      makeTestPlayer("opponent", [makeTestCard("o-hand", 5)], [makeTestCard("o-board", 8)], false, 0),
      2,
    );

    const action = chooseLookahead3PlyAIAction(state, "opponent", HARD_AI_WEIGHTS);
    expect(action.type).toBe("PLAY_CARD");
  });

  test("conserves legendary cards in Round 1 when score lead is comfortable", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 3, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-legend", 9),
        makeTestCard("o-common", 4),
      ], [makeTestCard("o-board", 6)]),
      1,
    );
    state.cardDefinitions["o-legend"] = {
      id: "o-legend",
      name: "Legend card",
      type: "unit",
      row: "melee",
      power: 9,
      rarity: "legend",
      effects: [],
      description: "",
    };
    state.cardDefinitions["o-common"] = {
      id: "o-common",
      name: "Common card",
      type: "unit",
      row: "melee",
      power: 4,
      rarity: "common",
      effects: [],
      description: "",
    };

    const action = chooseLookahead3PlyAIAction(state, "opponent", HARD_AI_WEIGHTS);
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-common");
    }
  });
});
```

- [ ] **Step 2: Run the newly created test file**

Run:
```bash
pnpm --filter @warring-states/game-core test src/ai/lookaheadAI.test.ts
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add packages/game-core/src/ai/lookaheadAI.test.ts
git commit -m "test(ai): add unit tests for 3-ply lookahead AI and survival overrides"
```

---

## Task 7: Benchmark 3-Ply AI vs Utility V1

**Files:**
- Modify: `packages/game-core/src/ai/aiBenchmark.test.ts`

- [ ] **Step 1: Benchmark lookahead-3ply against utility-v1**

Modify `packages/game-core/src/ai/aiBenchmark.test.ts` to assert that `lookahead-3ply` defeats `utility-v1` with a win rate of at least 65%.

```typescript
import { describe, expect, test } from "vitest";
import { compareAIStrategies } from "./aiComparison";

describe("AI Benchmark - strategy comparisons", () => {
  test("lookahead-3ply achieves high win rate against utility-v1 in mirrors", () => {
    const report = compareAIStrategies({
      seed: "bench-seed-lookahead-3ply",
      games: 50,
      aiA: "lookahead-3ply",
      aiB: "utility-v1",
      factionA: "qin",
      factionB: "qin",
    });

    const winRate = (report.aiA.wins / report.games) * 100;
    console.log(`[AI Bench 3-Ply] Wins: ${report.aiA.wins}, Losses: ${report.aiB.wins}, Draws: ${report.draws}. Win Rate: ${winRate.toFixed(1)}%`);

    expect(report.games).toBe(50);
    expect(report.completedGames).toBe(50);
    expect(report.stoppedByMaxTurns).toBe(0);
    expect(winRate).toBeGreaterThanOrEqual(65);
  });
});
```

- [ ] **Step 2: Run the benchmark test**

Run:
```bash
pnpm --filter @warring-states/game-core test src/ai/aiBenchmark.test.ts
```

- [ ] **Step 3: Commit**
```bash
git add packages/game-core/src/ai/aiBenchmark.test.ts
git commit -m "test(ai): update benchmark to compare lookahead-3ply against utility-v1"
```

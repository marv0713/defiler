# AI Difficulty and Synergy Heuristics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Easy/Normal/Hard AI difficulty profiles and card synergy heuristics (kill-shots and row-buff sequencing) in the game-core evaluation engine.

**Architecture:** We will add `synergyBonusScale` and `killShotBonus` weights to the `UtilityAIWeights` interface. The `evaluateStateForPlayer` function will calculate row-buff hand synergy and penalize destroyed units in the graveyard. We will verify the changes with Vitest unit tests and a 100-match simulation bench.

**Tech Stack:** TypeScript, Zustand, Vitest.

---

### Task 1: Update UtilityAIWeights and Profiles

**Files:**
- Modify: `packages/game-core/src/ai/aiEvaluation.ts`

- [ ] **Step 1: Update UtilityAIWeights interface**
  Add `synergyBonusScale` and `killShotBonus` properties to `UtilityAIWeights`.

```typescript
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
  synergyBonusScale: number;
  killShotBonus: number;
}
```

- [ ] **Step 2: Update EASY_AI_WEIGHTS, NORMAL_AI_WEIGHTS, and HARD_AI_WEIGHTS**
  Update the weight definitions to include the new values.

```typescript
export const NORMAL_AI_WEIGHTS: UtilityAIWeights = {
  scoreDiff: 1,
  roundWinsDiff: 25,
  handAdvantage: 5,
  deckAdvantage: 1,
  boardUnitAdvantage: 1,
  cardResourceCost: 0.35,
  overBudgetPenalty: 8,
  hopelessChasePenalty: 18,
  opponentPassedLeadBonus: 30,
  finalRoundUrgency: 12,
  synergyBonusScale: 0.5,
  killShotBonus: 4,
};

export const EASY_AI_WEIGHTS: UtilityAIWeights = {
  scoreDiff: 1,
  roundWinsDiff: 20,
  handAdvantage: 2,
  deckAdvantage: 0.5,
  boardUnitAdvantage: 0.5,
  cardResourceCost: 0.15,
  overBudgetPenalty: 3,
  hopelessChasePenalty: 8,
  opponentPassedLeadBonus: 15,
  finalRoundUrgency: 6,
  synergyBonusScale: 0.0,
  killShotBonus: 0,
};

export const HARD_AI_WEIGHTS: UtilityAIWeights = {
  scoreDiff: 1.2,
  roundWinsDiff: 30,
  handAdvantage: 8,
  deckAdvantage: 1.5,
  boardUnitAdvantage: 1.5,
  cardResourceCost: 0.55,
  overBudgetPenalty: 12,
  hopelessChasePenalty: 24,
  opponentPassedLeadBonus: 45,
  finalRoundUrgency: 20,
  synergyBonusScale: 1.0,
  killShotBonus: 6,
};
```

- [ ] **Step 3: Run the test suite to verify no compile errors**
  Run: `pnpm test`
  Expected: All existing tests pass, but we might have typecheck warnings if other tests use raw objects that mock `UtilityAIWeights`. (Let's make sure typescript is clean).

- [ ] **Step 4: Commit**
  ```bash
  git add packages/game-core/src/ai/aiEvaluation.ts
  git commit -m "feat(ai): add synergy and kill-shot properties to AI weights"
  ```

---

### Task 2: Implement Synergy and Kill-Shot Heuristics in evaluateStateForPlayer

**Files:**
- Modify: `packages/game-core/src/ai/aiEvaluation.ts`

- [ ] **Step 1: Update evaluateStateForPlayer**
  Add graveyard destroyed unit counts and hand row-buff calculations.

```typescript
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

  // Kill Shot penalty/bonus (graveyard isDestroyed cards).
  const playerDestroyed = player.graveyard.filter((c) => c.isDestroyed).length;
  const opponentDestroyed = opponent.graveyard.filter((c) => c.isDestroyed).length;
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
```

- [ ] **Step 2: Run the test suite**
  Run: `pnpm test`
  Expected: PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add packages/game-core/src/ai/aiEvaluation.ts
  git commit -m "feat(ai): implement row-buff and kill-shot heuristics in state evaluation"
  ```

---

### Task 3: Add Targeted Synergy Unit Tests

**Files:**
- Modify: `packages/game-core/src/ai/normalAI.test.ts`

- [ ] **Step 1: Write Kill-Shot Preference test**
  Add a test to verify that the AI chooses to kill an enemy unit when given a choice.

```typescript
  test("chooseNormalAIAction prefers kill-shots over random damage", () => {
    // Enemy has a 3-power unit and a 5-power unit on board.
    // AI player has a 3-damage unit card ("qin-war-chariot", which deals 2 damage and is power 7,
    // or let's use a card with 3 damage, or just create a mock card in definitions).
    // Let's use standard cardDefinitions or create a mock definition.
    const state = makeTestState(
      makeTestPlayer("player", [], [
        makeTestCard("p-u1", 3, "player"), // 3 power
        makeTestCard("p-u2", 5, "player"), // 5 power
      ]),
      makeTestPlayer("opponent", [makeTestCard("o-dmg", 4)]), // Opponent hand has 1 unit
      1,
    );
    // Add a card definition for "o-dmg" that deals 3 damage to ENEMY_LOWEST (kills p-u1) or ENEMY_HIGHEST (leaves p-u2 alive).
    // Better, set up legal actions so that playing it targets p-u1 (kills) vs p-u2 (damages).
    // Since target selection is automatic, we can define two action paths or mock card effects.
    // Let's test with a mock damage card that targets ENEMY_LOWEST (kills p-u1) and see if score is higher than ENEMY_HIGHEST.
    const actionKill = {
      type: "PLAY_CARD" as const,
      playerId: "opponent" as const,
      cardInstanceId: "o-dmg",
    };
    state.cardDefinitions["o-dmg"] = {
      id: "o-dmg",
      name: "Mock Damage",
      type: "unit",
      row: "melee",
      power: 4,
      rarity: "common",
      effects: [{ type: "DAMAGE", target: { type: "ENEMY_LOWEST" }, amount: 3 }],
    };

    const scoreKill = scoreNormalAIAction(state, actionKill, "opponent", NORMAL_AI_WEIGHTS);
    expect(scoreKill.total).toBeGreaterThan(Number.NEGATIVE_INFINITY);
  });
```
  Let's refine the test to be more direct. Set up two mock actions that result in different states, and check if the AI chooses the action that kills the unit.

```typescript
  test("chooseNormalAIAction chooses kill-shot action over non-killing play", () => {
    // We create a custom test state where opponent has two cards in hand.
    // Card A is "o-kill": deals 3 damage to ENEMY_LOWEST (kills a 3-power unit).
    // Card B is "o-normal": is just a white unit with 7 power.
    // We compare which card the AI chooses to play.
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-target", 3, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-kill", 4),
        makeTestCard("o-normal", 7),
      ]),
      1,
    );
    state.cardDefinitions["o-kill"] = {
      id: "o-kill",
      name: "Dmg unit",
      type: "unit",
      row: "melee",
      power: 3,
      rarity: "common",
      effects: [{ type: "DAMAGE", target: { type: "ENEMY_LOWEST" }, amount: 3 }],
    };
    state.cardDefinitions["o-normal"] = {
      id: "o-normal",
      name: "Vanilla unit",
      type: "unit",
      row: "melee",
      power: 7,
      rarity: "common",
      effects: [],
    };

    // Card B (7 power vanilla) gives 7 net points on board.
    // Card A (3 power + 3 damage kill) gives 3 + 3 = 6 net points on board, but gets the Kill Shot bonus (+4 points).
    // Total value of A: 6 + 4 = 10 points.
    // So the AI should choose "o-kill"!
    const action = chooseNormalAIAction(state, "opponent", NORMAL_AI_WEIGHTS);
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-kill");
    }
  });

  test("chooseNormalAIAction prefers playing units before applying row-buffs", () => {
    // Opponent has a row buff card ("o-buff": buff melee row by 2) and a vanilla unit ("o-unit": power 5).
    // Melee row is currently empty.
    const state = makeTestState(
      makeTestPlayer("player"),
      makeTestPlayer("opponent", [
        makeTestCard("o-buff", 2),
        makeTestCard("o-unit", 5),
      ]),
      1,
    );
    state.cardDefinitions["o-buff"] = {
      id: "o-buff",
      name: "Melee Buff",
      type: "unit",
      row: "melee",
      power: 2,
      rarity: "elite",
      effects: [{ type: "BUFF", target: { type: "ALLY_ROW", row: "melee" }, amount: 2 }],
    };
    state.cardDefinitions["o-unit"] = {
      id: "o-unit",
      name: "Melee Unit",
      type: "unit",
      row: "melee",
      power: 5,
      rarity: "common",
      effects: [],
    };

    // If AI plays o-buff first, it gets 2 power, and buff does nothing. Total power = 2.
    // If AI plays o-unit first, it gets 5 power, AND because o-buff is in hand, it gets synergy bonus (1 unit * 2 buff * 0.5 = +1). Total power evaluation = 6.
    // So the AI should choose o-unit!
    const action = chooseNormalAIAction(state, "opponent", NORMAL_AI_WEIGHTS);
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-unit");
    }
  });
```

- [ ] **Step 2: Run the tests to make sure they pass**
  Run: `pnpm --filter @warring-states/game-core test -- normalAI.test.ts`
  Expected: PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add packages/game-core/src/ai/normalAI.test.ts
  git commit -m "test(ai): add row-buff and kill-shot synergy decision tests"
  ```

---

### Task 4: Implement 100-Match AI Benchmark Test

**Files:**
- Create: `packages/game-core/src/ai/aiBenchmark.test.ts`

- [ ] **Step 1: Write the simulation benchmark test**
  Create a test file to run 100 Qin vs Qin matches: Player (Hard AI) vs Opponent (Normal AI), and assert Player wins >= 60%.

```typescript
import { describe, expect, test } from "vitest";
import { simulateGame } from "../simulator/simulateGame";
import { chooseNormalAIAction } from "./normalAI";
import { HARD_AI_WEIGHTS, NORMAL_AI_WEIGHTS } from "./aiEvaluation";
import type { GameState, PlayerId } from "../types";

describe("AI Benchmark - Hard AI vs Normal AI", () => {
  test("Hard AI achieves >= 60% win rate against Normal AI in 100 mirrors", () => {
    let hardWins = 0;
    let normalWins = 0;
    let draws = 0;
    const runs = 100;

    for (let i = 0; i < runs; i++) {
      const seed = `bench-seed-${i}`;
      const result = simulateGame({
        seed,
        playerFaction: "qin",
        opponentFaction: "qin",
        firstPlayerId: i % 2 === 0 ? "player" : "opponent", // Alternate first player
        chooseAction: (state: GameState, playerId: PlayerId) => {
          if (playerId === "player") {
            // Player uses Hard AI (tuned weights + full synergy heuristics)
            return chooseNormalAIAction(state, playerId, HARD_AI_WEIGHTS);
          } else {
            // Opponent uses Normal AI
            return chooseNormalAIAction(state, playerId, NORMAL_AI_WEIGHTS);
          }
        },
      });

      if (result.winner === "player") {
        hardWins++;
      } else if (result.winner === "opponent") {
        normalWins++;
      } else {
        draws++;
      }
    }

    const winRate = (hardWins / runs) * 100;
    console.log(`[AI Bench] Hard AI Wins: ${hardWins}, Normal AI Wins: ${normalWins}, Draws: ${draws}. Win Rate: ${winRate.toFixed(1)}%`);

    // Assert that Hard AI performs significantly better than Normal AI (>= 60% win rate).
    expect(winRate).toBeGreaterThanOrEqual(60);
  });
});
```

- [ ] **Step 2: Run the benchmark test**
  Run: `pnpm --filter @warring-states/game-core test -- src/ai/aiBenchmark.test.ts`
  Expected: PASS. (It should print the win rate and succeed).

- [ ] **Step 3: Commit the benchmark test**
  ```bash
  git add packages/game-core/src/ai/aiBenchmark.test.ts
  git commit -m "test(ai): add 100-match win-rate benchmark for Hard vs Normal AI"
  ```

---

### Task 5: Final Validation

- [ ] **Step 1: Run full test suite and clean build**
  Run: `pnpm test && pnpm build`
  Expected: All 154+ tests pass and builds succeed.

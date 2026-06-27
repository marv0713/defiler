# Pluggable AI Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pluggable AI architecture with three interchangeable AI implementations, then compare their PvE strength with deterministic simulator benchmarks.

**Architecture:** Add a small `AIStrategy` interface and registry in `packages/game-core/src/ai`. Wrap the current Utility AI as `utility-v1`, add a strategic round planner as `round-strategy`, and extract shallow response search as `lookahead-1ply`. Simulator and web store code choose AI by id instead of directly depending on one implementation.

**Tech Stack:** TypeScript, Vitest, Vite, Zustand, pure game-core functions.

---

## File Structure

- Create: `packages/game-core/src/ai/aiStrategy.ts`
  - Owns `AIId`, `AIContext`, `AIStrategy`, `getAIStrategy`, and `chooseAIAction`.
- Create: `packages/game-core/src/ai/cardRoles.ts`
  - Derives generic card roles from `CardDefinition` and effect configs.
- Create: `packages/game-core/src/ai/roundStrategyAI.ts`
  - Builds `RoundContext`, chooses `RoundPlan`, and implements `round-strategy`.
- Create: `packages/game-core/src/ai/lookaheadAI.ts`
  - Implements `lookahead-1ply` by evaluating AI action plus one Utility V1 opponent response.
- Create: `packages/game-core/src/ai/aiComparison.ts`
  - Runs deterministic AI-vs-AI comparisons and returns comparison metrics.
- Create: `packages/game-core/src/ai/aiStrategy.test.ts`
  - Tests strategy registry and compatibility wrappers.
- Create: `packages/game-core/src/ai/cardRoles.test.ts`
  - Tests generic role derivation without card-id-specific rules.
- Create: `packages/game-core/src/ai/roundStrategyAI.test.ts`
  - Tests known weak behaviors: cheap catch-up, conceding expensive rounds, final all-in.
- Create: `packages/game-core/src/ai/aiComparison.test.ts`
  - Tests benchmark output shape and deterministic behavior.
- Modify: `packages/game-core/src/ai/normalAI.ts`
  - Keep scoring helpers; make `chooseNormalAIAction` route through `chooseAIAction`.
- Modify: `packages/game-core/src/ai/aiEvaluation.ts`
  - Export any generic helpers needed by strategy modules.
- Modify: `packages/game-core/src/simulator/simulateGame.ts`
  - Accept `AIId` or continue accepting `chooseAction`, with `chooseAction` still taking priority.
- Modify: `packages/game-core/src/simulator/simulateMatchup.ts`
  - Keep existing API stable; optionally route default chooser through `chooseAIAction`.
- Modify: `packages/game-core/src/index.ts`
  - Export new AI strategy and benchmark APIs.
- Modify: `apps/web/src/store/gameStore.ts`
  - Select AI id from campaign difficulty through one helper; no React components involved.
- Modify: `task_plan.md`, `progress.md`, `findings.md`
  - Update Phase 8 / Task 8.1 status before implementation and after completion.

---

### Task 1: Add AI Strategy Interface and Registry

**Files:**
- Create: `packages/game-core/src/ai/aiStrategy.ts`
- Create: `packages/game-core/src/ai/aiStrategy.test.ts`
- Modify: `packages/game-core/src/index.ts`

- [ ] **Step 1: Write failing registry tests**

Add `packages/game-core/src/ai/aiStrategy.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { getLegalActions } from "../rules/legalActions";
import { makeTestCard, makeTestPlayer, makeTestState } from "./aiTestHelpers";
import { chooseAIAction, getAIStrategy } from "./aiStrategy";

describe("AI strategy registry", () => {
  test("utility-v1 returns a legal action through the strategy interface", () => {
    const state = makeTestState(
      makeTestPlayer("player"),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 5)]),
    );

    const action = chooseAIAction({
      aiId: "utility-v1",
      state,
      playerId: "opponent",
    });

    expect(getLegalActions(state, "opponent")).toContainEqual(action);
  });

  test("registry exposes all planned 8.1 AI ids", () => {
    expect(getAIStrategy("utility-v1").id).toBe("utility-v1");
    expect(getAIStrategy("round-strategy").id).toBe("round-strategy");
    expect(getAIStrategy("lookahead-1ply").id).toBe("lookahead-1ply");
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/aiStrategy.test.ts
```

Expected: fail because `./aiStrategy` does not exist.

- [ ] **Step 3: Implement minimal registry with all ids**

Add `packages/game-core/src/ai/aiStrategy.ts`:

```ts
import type { GameAction } from "../rules/actions";
import type { GameState, PlayerId } from "../types";
import type { UtilityAIWeights } from "./aiEvaluation";
import { chooseUtilityV1AIAction } from "./normalAI";

export type AIId = "utility-v1" | "round-strategy" | "lookahead-1ply";

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

const utilityV1Strategy: AIStrategy = {
  id: "utility-v1",
  label: "Utility V1",
  chooseAction: ({ state, playerId, weights }) =>
    chooseUtilityV1AIAction(state, playerId, weights),
};

const roundStrategyPlaceholder: AIStrategy = {
  id: "round-strategy",
  label: "Round Strategy",
  chooseAction: utilityV1Strategy.chooseAction,
};

const lookaheadPlaceholder: AIStrategy = {
  id: "lookahead-1ply",
  label: "Lookahead 1-Ply",
  chooseAction: utilityV1Strategy.chooseAction,
};

const STRATEGIES: Record<AIId, AIStrategy> = {
  "utility-v1": utilityV1Strategy,
  "round-strategy": roundStrategyPlaceholder,
  "lookahead-1ply": lookaheadPlaceholder,
};

export function getAIStrategy(aiId: AIId): AIStrategy {
  return STRATEGIES[aiId];
}

export function chooseAIAction(
  context: AIContext & { aiId?: AIId },
): GameAction {
  return getAIStrategy(context.aiId ?? "utility-v1").chooseAction(context);
}
```

Modify `packages/game-core/src/ai/normalAI.ts` by renaming the current exported chooser body to `chooseUtilityV1AIAction`, then adding the compatibility wrapper:

```ts
export function chooseUtilityV1AIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  // Move the existing chooseNormalAIAction implementation body here.
}

export function chooseNormalAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  return chooseUtilityV1AIAction(state, playerId, weights);
}
```

Modify `packages/game-core/src/index.ts`:

```ts
export {
  chooseAIAction,
  getAIStrategy,
  type AIContext,
  type AIId,
  type AIStrategy,
} from "./ai/aiStrategy";
export {
  chooseNormalAIAction,
  chooseUtilityV1AIAction,
  scoreNormalAIAction,
} from "./ai/normalAI";
```

- [ ] **Step 4: Run registry test**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/aiStrategy.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/game-core/src/ai/aiStrategy.ts packages/game-core/src/ai/aiStrategy.test.ts packages/game-core/src/ai/normalAI.ts packages/game-core/src/index.ts
git commit -m "feat(ai): add pluggable AI strategy registry"
```

---

### Task 2: Add Generic Card Role Classification

**Files:**
- Create: `packages/game-core/src/ai/cardRoles.ts`
- Create: `packages/game-core/src/ai/cardRoles.test.ts`
- Modify: `packages/game-core/src/index.ts`

- [ ] **Step 1: Write failing role tests**

Add `packages/game-core/src/ai/cardRoles.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import type { CardDefinition } from "../types";
import { classifyCardRoles } from "./cardRoles";

function card(overrides: Partial<CardDefinition>): CardDefinition {
  return {
    id: "test-card",
    name: "Test Card",
    type: "unit",
    faction: "qin",
    row: "melee",
    power: 4,
    rarity: "common",
    effects: [],
    ...overrides,
  };
}

describe("classifyCardRoles", () => {
  test("classifies damage and destroy effects as removal", () => {
    expect(classifyCardRoles(card({
      effects: [{ type: "DAMAGE", target: { type: "ENEMY_LOWEST" }, amount: 3 }],
    })).toContain("removal");

    expect(classifyCardRoles(card({
      effects: [{ type: "DESTROY", target: { type: "ENEMY_LOWEST" } }],
    })).toContain("removal");
  });

  test("classifies row buffs and resource effects generically", () => {
    expect(classifyCardRoles(card({
      effects: [{ type: "BUFF", target: { type: "ALLY_ROW", row: "melee" }, amount: 2 }],
    })).toContain("row_buff");

    expect(classifyCardRoles(card({
      effects: [{ type: "DRAW_DISCARD", draw: 2, discard: 1 }],
    })).toContain("resource");
  });

  test("classifies high-rarity and high-power cards as finishers", () => {
    expect(classifyCardRoles(card({ rarity: "legend", power: 8 }))).toContain("finisher");
    expect(classifyCardRoles(card({ rarity: "common", power: 8 }))).toContain("tempo");
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/cardRoles.test.ts
```

Expected: fail because `./cardRoles` does not exist.

- [ ] **Step 3: Implement role classifier**

Add `packages/game-core/src/ai/cardRoles.ts`:

```ts
import type { CardDefinition } from "../types";

export type CardRole =
  | "filler"
  | "tempo"
  | "removal"
  | "row_buff"
  | "setup"
  | "finisher"
  | "resource";

export function classifyCardRoles(definition: CardDefinition): Set<CardRole> {
  const roles = new Set<CardRole>();

  if (definition.power >= 7) roles.add("tempo");
  if (definition.rarity === "hero" || definition.rarity === "legend") {
    roles.add("finisher");
  }

  for (const effect of definition.effects) {
    if (
      effect.type === "DAMAGE" ||
      effect.type === "DESTROY" ||
      effect.type === "LOCK"
    ) {
      roles.add("removal");
    }
    if (effect.type === "BUFF" && effect.target.type === "ALLY_ROW") {
      roles.add("row_buff");
    }
    if (effect.type === "SUMMON") {
      roles.add("setup");
    }
    if (effect.type === "DRAW_DISCARD" || effect.type === "REVIVE") {
      roles.add("resource");
    }
    if (effect.type === "CONDITIONAL_BOOST") {
      roles.add("finisher");
    }
  }

  if (roles.size === 0) roles.add("filler");
  return roles;
}
```

Modify `packages/game-core/src/index.ts`:

```ts
export { classifyCardRoles, type CardRole } from "./ai/cardRoles";
```

- [ ] **Step 4: Run role tests**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/cardRoles.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/game-core/src/ai/cardRoles.ts packages/game-core/src/ai/cardRoles.test.ts packages/game-core/src/index.ts
git commit -m "feat(ai): classify generic card roles"
```

---

### Task 3: Implement Round Strategy AI

**Files:**
- Create: `packages/game-core/src/ai/roundStrategyAI.ts`
- Create: `packages/game-core/src/ai/roundStrategyAI.test.ts`
- Modify: `packages/game-core/src/ai/aiStrategy.ts`
- Modify: `packages/game-core/src/index.ts`

- [ ] **Step 1: Write failing round strategy tests**

Add `packages/game-core/src/ai/roundStrategyAI.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { makeTestCard, makeTestPlayer, makeTestState } from "./aiTestHelpers";
import { chooseRoundStrategyAIAction, getRoundPlan } from "./roundStrategyAI";

describe("round-strategy AI", () => {
  test("uses the cheapest catch-up card when opponent has passed", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 10, "player")], true),
      makeTestPlayer("opponent", [
        makeTestCard("o-small", 3),
        makeTestCard("o-big", 9),
      ], [makeTestCard("o-board", 8)]),
      1,
    );

    const action = chooseRoundStrategyAIAction(state, "opponent");
    expect(action.type).toBe("PLAY_CARD");
    if (action.type === "PLAY_CARD") {
      expect(action.cardInstanceId).toBe("o-small");
    }
  });

  test("concedes round 1 when catch-up requires too many cards", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 18, "player")]),
      makeTestPlayer("opponent", [
        makeTestCard("o-a", 4),
        makeTestCard("o-b", 4),
        makeTestCard("o-c", 4),
      ]),
      1,
    );

    expect(getRoundPlan(state, "opponent").plan).toBe("concede_round");
    expect(chooseRoundStrategyAIAction(state, "opponent").type).toBe("PASS");
  });

  test("plays in round 3 instead of conserving hand", () => {
    const state = makeTestState(
      makeTestPlayer("player", [], [makeTestCard("p-board", 9, "player")], false, 1),
      makeTestPlayer("opponent", [makeTestCard("o-finisher", 10)], [], false, 1),
      3,
    );

    expect(getRoundPlan(state, "opponent").plan).toBe("final_all_in");
    expect(chooseRoundStrategyAIAction(state, "opponent").type).toBe("PLAY_CARD");
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/roundStrategyAI.test.ts
```

Expected: fail because `./roundStrategyAI` does not exist.

- [ ] **Step 3: Implement round context and plans**

Add `packages/game-core/src/ai/roundStrategyAI.ts`:

```ts
import type { GameAction, PlayCardAction } from "../rules/actions";
import { getLegalActions } from "../rules/legalActions";
import { applyAction } from "../rules/reducer";
import { calculateScores } from "../rules/scoring";
import type { GameState, PlayerId } from "../types";
import {
  NORMAL_AI_WEIGHTS,
  estimateCardResourceCost,
  estimateCatchupPlan,
  evaluateStateForPlayer,
  getOpponentId,
  type CatchupPlan,
  type UtilityAIWeights,
} from "./aiEvaluation";
import { scoreNormalAIAction } from "./normalAI";

export type RoundPlan =
  | "concede_round"
  | "cheap_catchup"
  | "contest_round"
  | "bleed_opponent"
  | "must_win"
  | "final_all_in";

export interface RoundPlanResult {
  plan: RoundPlan;
  catchup: CatchupPlan;
  scoreLead: number;
}

function getPlayCardCost(state: GameState, action: PlayCardAction): number {
  const card = state.players[action.playerId].hand.find(
    (handCard) => handCard.instanceId === action.cardInstanceId,
  );
  return card ? estimateCardResourceCost(state, card) : Number.POSITIVE_INFINITY;
}

function actionOvertakes(
  state: GameState,
  action: PlayCardAction,
  playerId: PlayerId,
): boolean {
  const next = applyAction(state, action);
  const scores = calculateScores(next);
  return scores[playerId] > scores[getOpponentId(playerId)];
}

export function getRoundPlan(
  state: GameState,
  playerId: PlayerId,
): RoundPlanResult {
  const opponentId = getOpponentId(playerId);
  const scores = calculateScores(state);
  const scoreLead = scores[playerId] - scores[opponentId];
  const player = state.players[playerId];
  const opponent = state.players[opponentId];
  const catchup = estimateCatchupPlan(state, playerId);

  if (state.currentRound >= 3) {
    return { plan: "final_all_in", catchup, scoreLead };
  }

  if (player.roundWins < opponent.roundWins) {
    return { plan: "must_win", catchup, scoreLead };
  }

  if (opponent.hasPassed && scoreLead <= 0 && catchup.canCatchUp && catchup.cardsNeeded <= 1) {
    return { plan: "cheap_catchup", catchup, scoreLead };
  }

  if (state.currentRound === 1 && scoreLead < 0 && catchup.cardsNeeded >= 3) {
    return { plan: "concede_round", catchup, scoreLead };
  }

  if (state.currentRound === 2 && player.roundWins > opponent.roundWins) {
    return { plan: "bleed_opponent", catchup, scoreLead };
  }

  return { plan: "contest_round", catchup, scoreLead };
}

function chooseCheapestCatchup(
  state: GameState,
  playerId: PlayerId,
): GameAction | null {
  const candidates = getLegalActions(state, playerId)
    .filter((action): action is PlayCardAction => action.type === "PLAY_CARD")
    .filter((action) => actionOvertakes(state, action, playerId))
    .sort((left, right) => getPlayCardCost(state, left) - getPlayCardCost(state, right));

  return candidates[0] ?? null;
}

export function chooseRoundStrategyAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  if (legalActions.length === 0) return { type: "PASS", playerId };

  const roundPlan = getRoundPlan(state, playerId).plan;
  const pass = legalActions.find((action) => action.type === "PASS") ?? { type: "PASS" as const, playerId };

  if (roundPlan === "concede_round") return pass;

  if (roundPlan === "cheap_catchup") {
    return chooseCheapestCatchup(state, playerId) ?? pass;
  }

  let best = scoreNormalAIAction(state, legalActions[0], playerId, weights);
  for (const action of legalActions.slice(1)) {
    const score = scoreNormalAIAction(state, action, playerId, weights);
    const planBonus =
      roundPlan === "final_all_in" && action.type === "PLAY_CARD"
        ? 20
        : roundPlan === "bleed_opponent" && action.type === "PLAY_CARD"
          ? -getPlayCardCost(state, action)
          : 0;
    const adjusted = { ...score, total: score.total + planBonus };
    if (adjusted.total > best.total) best = adjusted;
  }

  return best.action;
}
```

- [ ] **Step 4: Register round-strategy**

Modify `packages/game-core/src/ai/aiStrategy.ts`:

```ts
import { chooseRoundStrategyAIAction } from "./roundStrategyAI";

const roundStrategy: AIStrategy = {
  id: "round-strategy",
  label: "Round Strategy",
  chooseAction: ({ state, playerId, weights }) =>
    chooseRoundStrategyAIAction(state, playerId, weights),
};

const STRATEGIES: Record<AIId, AIStrategy> = {
  "utility-v1": utilityV1Strategy,
  "round-strategy": roundStrategy,
  "lookahead-1ply": lookaheadPlaceholder,
};
```

Modify `packages/game-core/src/index.ts`:

```ts
export {
  chooseRoundStrategyAIAction,
  getRoundPlan,
  type RoundPlan,
  type RoundPlanResult,
} from "./ai/roundStrategyAI";
```

- [ ] **Step 5: Run round strategy tests**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/roundStrategyAI.test.ts src/ai/aiStrategy.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add packages/game-core/src/ai/roundStrategyAI.ts packages/game-core/src/ai/roundStrategyAI.test.ts packages/game-core/src/ai/aiStrategy.ts packages/game-core/src/index.ts
git commit -m "feat(ai): add round strategy AI"
```

---

### Task 4: Implement Lookahead 1-Ply AI

**Files:**
- Create: `packages/game-core/src/ai/lookaheadAI.ts`
- Modify: `packages/game-core/src/ai/aiStrategy.ts`
- Modify: `packages/game-core/src/ai/aiStrategy.test.ts`
- Modify: `packages/game-core/src/index.ts`

- [ ] **Step 1: Add lookahead legal-action test**

Append to `packages/game-core/src/ai/aiStrategy.test.ts`:

```ts
  test("lookahead-1ply returns a legal action", () => {
    const state = makeTestState(
      makeTestPlayer("player", [makeTestCard("p-h1", 5)]),
      makeTestPlayer("opponent", [makeTestCard("o-h1", 5)]),
    );

    const action = chooseAIAction({
      aiId: "lookahead-1ply",
      state,
      playerId: "opponent",
    });

    expect(getLegalActions(state, "opponent")).toContainEqual(action);
  });
```

- [ ] **Step 2: Run test**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/aiStrategy.test.ts
```

Expected: pass initially if placeholder is still active. Keep this test as a
regression guard when replacing the placeholder.

- [ ] **Step 3: Implement lookahead chooser**

Add `packages/game-core/src/ai/lookaheadAI.ts`:

```ts
import type { GameAction } from "../rules/actions";
import { getLegalActions } from "../rules/legalActions";
import { applyAction } from "../rules/reducer";
import type { GameState, PlayerId } from "../types";
import {
  NORMAL_AI_WEIGHTS,
  evaluateStateForPlayer,
  getOpponentId,
  type UtilityAIWeights,
} from "./aiEvaluation";
import { chooseUtilityV1AIAction, scoreNormalAIAction } from "./normalAI";

export function chooseLookahead1PlyAIAction(
  state: GameState,
  playerId: PlayerId,
  weights: UtilityAIWeights = NORMAL_AI_WEIGHTS,
): GameAction {
  const legalActions = getLegalActions(state, playerId);
  if (legalActions.length === 0) return { type: "PASS", playerId };

  const before = evaluateStateForPlayer(state, playerId, weights);
  let bestAction = legalActions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const action of legalActions) {
    try {
      const immediate = scoreNormalAIAction(state, action, playerId, weights);
      const afterAI = applyAction(state, action);
      let projected = afterAI;

      if (afterAI.status === "playing" && afterAI.currentPlayerId === getOpponentId(playerId)) {
        const opponentAction = chooseUtilityV1AIAction(
          afterAI,
          getOpponentId(playerId),
          NORMAL_AI_WEIGHTS,
        );
        projected = applyAction(afterAI, opponentAction);
      }

      const score =
        evaluateStateForPlayer(projected, playerId, weights) -
        before +
        immediate.resourceDelta;

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    } catch {
      // Ignore invalid projected branches; legal action generation should make
      // this rare, but effects can still expose bad test fixtures.
    }
  }

  return bestAction;
}
```

- [ ] **Step 4: Register lookahead**

Modify `packages/game-core/src/ai/aiStrategy.ts`:

```ts
import { chooseLookahead1PlyAIAction } from "./lookaheadAI";

const lookahead1PlyStrategy: AIStrategy = {
  id: "lookahead-1ply",
  label: "Lookahead 1-Ply",
  chooseAction: ({ state, playerId, weights }) =>
    chooseLookahead1PlyAIAction(state, playerId, weights),
};

const STRATEGIES: Record<AIId, AIStrategy> = {
  "utility-v1": utilityV1Strategy,
  "round-strategy": roundStrategy,
  "lookahead-1ply": lookahead1PlyStrategy,
};
```

Modify `packages/game-core/src/index.ts`:

```ts
export { chooseLookahead1PlyAIAction } from "./ai/lookaheadAI";
```

- [ ] **Step 5: Run strategy tests**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/aiStrategy.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add packages/game-core/src/ai/lookaheadAI.ts packages/game-core/src/ai/aiStrategy.ts packages/game-core/src/ai/aiStrategy.test.ts packages/game-core/src/index.ts
git commit -m "feat(ai): add one-ply lookahead strategy"
```

---

### Task 5: Add AI Comparison Benchmark

**Files:**
- Create: `packages/game-core/src/ai/aiComparison.ts`
- Create: `packages/game-core/src/ai/aiComparison.test.ts`
- Modify: `packages/game-core/src/index.ts`

- [ ] **Step 1: Write benchmark tests**

Add `packages/game-core/src/ai/aiComparison.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { compareAIStrategies } from "./aiComparison";

describe("compareAIStrategies", () => {
  test("returns deterministic aggregate metrics", () => {
    const first = compareAIStrategies({
      seed: "ai-compare-test",
      games: 6,
      aiA: "utility-v1",
      aiB: "round-strategy",
      factionA: "qin",
      factionB: "chu",
    });

    const second = compareAIStrategies({
      seed: "ai-compare-test",
      games: 6,
      aiA: "utility-v1",
      aiB: "round-strategy",
      factionA: "qin",
      factionB: "chu",
    });

    expect(second).toEqual(first);
    expect(first.games).toBe(6);
    expect(first.aiA.id).toBe("utility-v1");
    expect(first.aiB.id).toBe("round-strategy");
    expect(first.completedGames + first.stoppedByMaxTurns).toBe(6);
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/aiComparison.test.ts
```

Expected: fail because `./aiComparison` does not exist.

- [ ] **Step 3: Implement comparison helper**

Add `packages/game-core/src/ai/aiComparison.ts`:

```ts
import type { Faction, PlayerId } from "../types";
import { simulateGame } from "../simulator/simulateGame";
import type { AIId } from "./aiStrategy";
import { chooseAIAction } from "./aiStrategy";
import type { UtilityAIWeights } from "./aiEvaluation";

export interface AIComparisonConfig {
  seed: string;
  games: number;
  aiA: AIId;
  aiB: AIId;
  factionA: Faction;
  factionB: Faction;
  weightsA?: UtilityAIWeights;
  weightsB?: UtilityAIWeights;
  maxTurns?: number;
}

export interface AIComparisonSide {
  id: AIId;
  wins: number;
  winRate: number;
}

export interface AIComparisonReport {
  games: number;
  completedGames: number;
  stoppedByMaxTurns: number;
  aiA: AIComparisonSide;
  aiB: AIComparisonSide;
  draws: number;
  averageTurns: number;
  averageRounds: number;
}

function rate(count: number, games: number): number {
  return games === 0 ? 0 : count / games;
}

export function compareAIStrategies(config: AIComparisonConfig): AIComparisonReport {
  let completedGames = 0;
  let stoppedByMaxTurns = 0;
  let aiAWins = 0;
  let aiBWins = 0;
  let draws = 0;
  let totalTurns = 0;
  let totalRounds = 0;

  for (let index = 0; index < config.games; index += 1) {
    const result = simulateGame({
      seed: `${config.seed}-${index}`,
      playerFaction: config.factionA,
      opponentFaction: config.factionB,
      maxTurns: config.maxTurns,
      chooseAction: (state, playerId: PlayerId) =>
        chooseAIAction({
          aiId: playerId === "player" ? config.aiA : config.aiB,
          state,
          playerId,
          weights: playerId === "player" ? config.weightsA : config.weightsB,
        }),
    });

    if (result.stoppedReason === "game_finished") completedGames += 1;
    else stoppedByMaxTurns += 1;

    if (result.winner === "player") aiAWins += 1;
    else if (result.winner === "opponent") aiBWins += 1;
    else draws += 1;

    totalTurns += result.turns;
    totalRounds += result.rounds;
  }

  return {
    games: config.games,
    completedGames,
    stoppedByMaxTurns,
    aiA: { id: config.aiA, wins: aiAWins, winRate: rate(aiAWins, config.games) },
    aiB: { id: config.aiB, wins: aiBWins, winRate: rate(aiBWins, config.games) },
    draws,
    averageTurns: config.games === 0 ? 0 : totalTurns / config.games,
    averageRounds: config.games === 0 ? 0 : totalRounds / config.games,
  };
}
```

Modify `packages/game-core/src/index.ts`:

```ts
export {
  compareAIStrategies,
  type AIComparisonConfig,
  type AIComparisonReport,
} from "./ai/aiComparison";
```

- [ ] **Step 4: Run benchmark tests**

Run:

```bash
pnpm --filter @warring-states/game-core test src/ai/aiComparison.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/game-core/src/ai/aiComparison.ts packages/game-core/src/ai/aiComparison.test.ts packages/game-core/src/index.ts
git commit -m "feat(ai): add deterministic AI comparison benchmark"
```

---

### Task 6: Wire Campaign AI Selection

**Files:**
- Modify: `apps/web/src/store/gameStore.ts`
- Modify: `apps/web/src/store/gameStore.test.ts`
- Modify: `packages/game-core/src/index.ts` if helper is exported from game-core

- [ ] **Step 1: Add campaign mapping helper**

Prefer a pure helper near the store AI glue in `apps/web/src/store/gameStore.ts`:

```ts
import type { AIId } from "@warring-states/game-core";

function getCampaignAIIdForDifficulty(difficulty: number): AIId {
  if (difficulty <= 2) return "utility-v1";
  if (difficulty === 3) return "round-strategy";
  return "lookahead-1ply";
}
```

- [ ] **Step 2: Replace direct chooser call**

In `advanceOpponentAI`, replace direct `chooseNormalAIAction` call with:

```ts
const aiId = selectedLevel
  ? getCampaignAIIdForDifficulty(selectedLevel.difficulty)
  : "round-strategy";
const action = chooseAIAction({
  aiId,
  state: current,
  playerId: "opponent",
  weights,
});
```

Keep `getAIWeightsForDifficulty(selectedLevel.difficulty)` as the weight source.

- [ ] **Step 3: Update imports**

In `apps/web/src/store/gameStore.ts`, import:

```ts
chooseAIAction,
type AIId,
```

from `@warring-states/game-core`, and remove the unused
`chooseNormalAIAction` import.

- [ ] **Step 4: Add store regression test**

In `apps/web/src/store/gameStore.test.ts`, add a test that starts a difficulty 3
campaign level and verifies the public store can advance the opponent without
throwing:

```ts
it("starts campaign games through the pluggable AI chooser", () => {
  useGameStore.getState().goToLevelSelect();
  useGameStore.getState().setPlayerFaction("qi");
  useGameStore.getState().selectLevel(CAMPAIGN_LEVELS[2]);
  useGameStore.getState().autoFillDeck();

  expect(() => useGameStore.getState().startLevelGame()).not.toThrow();
  expect(useGameStore.getState().screen).toBe("game");
  expect(useGameStore.getState().gameState).not.toBeNull();
});
```

- [ ] **Step 5: Run web store tests**

Run:

```bash
pnpm --filter @warring-states/web test src/store/gameStore.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/store/gameStore.ts apps/web/src/store/gameStore.test.ts
git commit -m "feat(web): route campaign AI through strategy ids"
```

---

### Task 7: Full Verification and Documentation

**Files:**
- Modify: `task_plan.md`
- Modify: `progress.md`
- Modify: `findings.md`

- [ ] **Step 1: Run full validation**

Run:

```bash
npm test
pnpm typecheck
npm run build
```

Expected:

- `npm test`: all game-core and web tests pass.
- `pnpm typecheck`: clean.
- `npm run build`: clean.

- [ ] **Step 2: Run one comparison sample**

Run a one-off Node/Vitest-friendly script through the package test context or a
small temporary REPL command that imports `compareAIStrategies` from source and
compares:

```ts
compareAIStrategies({
  seed: "phase-8-1-sample",
  games: 30,
  aiA: "utility-v1",
  aiB: "round-strategy",
  factionA: "qin",
  factionB: "chu",
});
```

Expected:

- returns 30 total games;
- no max-turn runaway;
- report is deterministic when run twice with the same seed.

- [ ] **Step 3: Update task plan**

In `task_plan.md`, set:

```md
## Current Phase

Phase 8: PvE AI Strategy — **Complete**.
```

Add task row:

```md
| Phase 8 / Task 8.1 | **Complete** | Pluggable AI strategies: Utility V1 baseline, Round Strategy, Lookahead 1-Ply, deterministic AI comparison benchmark, campaign AI id mapping. |
```

- [ ] **Step 4: Update findings**

Append:

```md
## Pluggable AI Strategy (Phase 8 / Task 8.1)

- AI strategy selection now goes through `AIId` and `AIStrategy`.
- `utility-v1` preserves the old Utility AI baseline.
- `round-strategy` adds named three-round resource plans before tactical scoring.
- `lookahead-1ply` evaluates one predicted opponent response.
- Benchmarks should compare AI ids before replacing campaign defaults again.
```

- [ ] **Step 5: Update progress**

Append implementation summary and exact validation outputs:

```md
### Phase 8 / Task 8.1: Pluggable AI Strategy

- Added pluggable AI strategy interface and registry.
- Added generic card role classification.
- Added Round Strategy AI.
- Added Lookahead 1-Ply AI.
- Added deterministic AI comparison benchmark.
- Routed campaign AI through AI ids.
- Verification:
  - `npm test`: ...
  - `pnpm typecheck`: ...
  - `npm run build`: ...
```

- [ ] **Step 6: Commit documentation**

```bash
git add task_plan.md progress.md findings.md
git commit -m "docs: record pluggable AI strategy completion"
```

---

## Pre-Implementation Documentation Update

Before starting Task 1, update the working memory files:

- `task_plan.md`: mark Phase 8 / Task 8.1 as planned/in progress.
- `findings.md`: record the design decision to move from weight-only tuning to
  pluggable strategy comparison.
- `progress.md`: record that the spec and plan were created, with no code
  implementation started yet.

This pre-code update is required by the user request.

## Self-Review

- Spec coverage: the plan covers the pluggable interface, three AI
  implementations, generic card roles, comparison benchmark, campaign routing,
  tests, and documentation updates.
- Placeholder scan: no implementation step contains TBD/TODO/fill-in language.
- Type consistency: all AI ids match the spec exactly:
  `utility-v1`, `round-strategy`, `lookahead-1ply`.

# AI Difficulty and Synergy Heuristics Design

This document details the design and implementation plan for polishing the AI difficulty curve and making the PvE campaign more challenging. We focus on two key areas: tuning the weight profiles for different difficulty stars, and introducing card synergy heuristics in the evaluation engine.

---

## 1. Goal

Improve the opponent AI so that:
1. **Difficulty corresponds to playstyle**: Lower levels act recklessly and dump cards; higher levels conserve cards carefully and seek card advantage.
2. **AI recognizes card synergies**: The AI understands basic Gwent-style combos (e.g., waiting to play row-buffs until the row is populated, and prioritizing units on rows where a buff is held in hand).
3. **AI prioritizes tactical removal**: The AI values "kill shots" (destroying a unit with damage) over wasting damage on high-power targets.

---

## 2. Technical Architecture

The AI is built on a Utility valuation model. Every action is scored based on the state evaluation delta and resource cost penalties. All changes will be implemented in `packages/game-core` to keep the engine pure and platform-independent.

### 2.1 Weight Profiles (`aiEvaluation.ts`)

We define three profiles in [aiEvaluation.ts](file:///Users/marv/Documents/defiler/packages/game-core/src/ai/aiEvaluation.ts):
- **`EASY_AI_WEIGHTS` (Difficulty 1–2)**:
  - Low card cost penalty (`cardResourceCost: 0.15`) and low over-budget penalty (`overBudgetPenalty: 3`).
  - Low hand advantage value (`handAdvantage: 2`).
  - The AI plays units freely, over-commits early, and chases hopeless score differences.
- **`NORMAL_AI_WEIGHTS` (Difficulty 3)**:
  - Standard balanced Gwent heuristics.
- **`HARD_AI_WEIGHTS` (Difficulty 4–5)**:
  - High card cost penalty (`cardResourceCost: 0.55`) and over-budget penalty (`overBudgetPenalty: 12`).
  - High hand advantage value (`handAdvantage: 8`) and board unit advantage value (`boardUnitAdvantage: 1.5`).
  - Massively values passing once a safe lead is secured (`opponentPassedLeadBonus: 45`).
  - The AI will pass early in Round 1/2 to preserve cards if catching up requires too many resources.

### 2.2 Card Synergy Heuristics (`aiEvaluation.ts`)

We will enhance the state evaluation function [evaluateStateForPlayer](file:///Users/marv/Documents/defiler/packages/game-core/src/ai/aiEvaluation.ts#L127) to award bonus utility scores based on synergy context:

#### A. Row-Buff Synergy
*   **The Heuristic**:
    - If the player holds a row-buff card in hand (a unit/special card that applies a `BUFF` effect to a row target selector like `ALLY_ROW(melee)` or `ALLY_ROW(ranged)`), we award a small bonus (e.g., `+1` point per unit) for every unit already present on that row.
    - Conversely, when scoring the play of a row-buff card, the state delta will naturally be higher because it multiplies across the already-populated row.
    - This creates an incentive for the AI to:
      1. Play regular units onto a row *first* if it is holding a buff for that row.
      2. Hold the buff card until the row is populated to maximize point impact.
*   **Implementation details**:
    - Scan the player's hand for cards with `BUFF` effects targeting `ALLY_ROW` (or cards like `shang-yang`, `lord-chunshen`, `chu-flood-tactic` by effect definition).
    - Add a bonus to `evaluateStateForPlayer` equal to `0.5 * unitCount * buffCount` for the targeted row.

#### B. Tactical Damage and Kill Shots
*   **The Heuristic**:
    - Wasting a 3-damage effect on a 6-power unit reduces its power to 3, but the unit remains on board. Using a 3-damage effect on a 3-power unit kills it, removing its body and capabilities.
    - In Gwent, removing bodies is highly valuable because it negates future row-buffs and card triggers.
    - We will award a **"Kill Shot" bonus** if an action successfully reduces an enemy unit's power to `0` or destroys it.
*   **Implementation details**:
    - When evaluating the state after a play, if an enemy unit was destroyed or removed from the board, we add a bonus score.
    - **Bonus value**: `+4` points flat bonus per destroyed enemy unit (equivalent to removing a common body).
    - This naturally guides the AI to target its damage spells at units it can finish off, rather than spreading damage randomly.

---

## 3. Verification and Acceptance Plan

All gameplay changes must be verified using Vitest before completion.

### 3.1 Unit Test Coverage (`normalAI.test.ts`)
We will add unit tests in [normalAI.test.ts](file:///Users/marv/Documents/defiler/packages/game-core/src/ai/normalAI.test.ts) covering:
1.  **Kill-Shot Preference**: Set up a board with a 3-power enemy unit and a 5-power enemy unit. Provide the AI with a 3-damage spell. Verify that the AI targets the 3-power unit (securing the kill-shot bonus) rather than the 5-power unit.
2.  **Row-Buff Sequencing**: Set up a hand containing a blank melee unit and a melee-row buff unit. Verify that the AI prefers playing the blank unit first to build up the row before applying the buff.
3.  **Conservative Pass (Hard AI)**: Set up a Round 1 state where the AI is behind by 6 points. Verify that under `HARD_AI_WEIGHTS`, the AI chooses to Pass, whereas under `EASY_AI_WEIGHTS` it continues to play cards.

### 3.2 Simulation Benchmark
We will create a temporary test case or script comparing `Hard AI` vs `Normal AI` over 100 simulated games:
- **Baseline**: 100 matches.
- **Success Criteria**: The Hard AI (incorporating both adjusted weights and synergy heuristics) must achieve a win rate of **>= 60%** against the old Normal AI, proving a tangible improvement in decision quality.

---

## 4. Work Plan

1.  **Phase 1**: Add synergy helper analysis inside `packages/game-core/src/ai/aiEvaluation.ts`.
2.  **Phase 2**: Add row-buff hand detection and kill-shot evaluation in `evaluateStateForPlayer`.
3.  **Phase 4**: Write unit tests in `normalAI.test.ts` to verify the targeted behaviors. Fix any heuristic scoring bugs.
4.  **Phase 5**: Implement the 100-match simulation bench to assert the win-rate improvement.
5.  **Phase 6**: Clean up benchmarks, run `pnpm test` and `pnpm build`.

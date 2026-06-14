# Task Plan: Warring States Card Tactics

## Goal

Build the browser-first MVP described in `docs/product_design_document.md`, using `docs/tasks.md` as the long-term task roadmap.

## Source Documents

- `docs/product_design_document.md`
- `docs/technical_design_document.md`
- `docs/tasks.md`
- `AGENTS.md`

## Current Phase

Phase 3: Card Data and Effect System

## Task Status

| Task | Status | Notes |
|------|--------|-------|
| Phase 0 / Task 0.1 | Complete | React + TypeScript + Vite workspace scaffold exists. |
| Phase 0 / Task 0.2 | Complete | Vitest is configured for `packages/game-core`. |
| Phase 1 / Task 1.1 | Complete | Core types added in `packages/game-core/src/types.ts` and exported from `index.ts`. |
| Phase 1 / Task 1.2 | Complete | Shared constants added in `packages/game-core/src/constants.ts` and exported from `index.ts`. |
| Phase 1 / Task 1.3 | Complete | Deterministic seeded random utility and shuffle added. |
| Phase 1 / Task 1.4 | Complete | Initial game state creation added. |
| Phase 2 / Task 2.1 | Complete | Game action and target types added. |
| Phase 2 / Task 2.2 | Complete | Board scoring added. |
| Phase 2 / Task 2.3 | Complete | Basic legal action generation added. |
| Phase 2 / Task 2.4 | Complete | Reducer handles play card, pass, and start-next-round. |
| Phase 2 / Task 2.5 | Complete | Round settlement and next-round flow added. |
| Phase 3 / Task 3.1 | Complete | Initial 20-card MVP faction pool added. |
| Phase 3 / Task 3.2 | Complete | Card definition validation added. |
| Phase 3 / Task 3.3 | Complete | Formal effect type system added. |
| Phase 3 / Task 3.4 | Complete | Automatic target resolver implemented. |
| Phase 3 / Task 3.5 | Complete | Basic effect resolver (BUFF, DAMAGE, DESTROY, SUMMON) implemented. |
| Phase 3 / Task 3.6 | Complete | Resource effects (DRAW_DISCARD, REVIVE, LOCK) implemented. |
| Phase 3 / Task 3.7 | Complete | 60 cards (15/faction) with real effect configs. Validation passes. |
| Phase 4 / Task 4.1 | Complete | Simple AI: random play-card selection, always legal, full-game tested. |
| Phase 4 / Task 4.2 | **Next** | Heuristic AI with score-based pass decisions. |
| Phase 4 / Task 4.3 | Pending | Single-game AI vs AI simulation. |
| Phase 4 / Task 4.4 | Pending | Matchup simulation report (win rates, card stats). |

---

## Next Task: 4.1 Implement Simple AI

### Goal

Create `packages/game-core/src/ai/simpleAI.ts` with a basic AI that always returns a legal action and can complete a full game without infinite loops.

### Interface

```ts
export function chooseSimpleAIAction(
  state: GameState,
  playerId: PlayerId,
): GameAction;
```

### Behavior Rules

1. Get legal actions via `getLegalActions(state, playerId)`.
2. If no legal actions exist, fallback to `{ type: "PASS", playerId }`.
3. Separate actions into play actions and pass action.
4. If play actions exist, choose one at random using seeded random (`state.seed + "-ai-" + state.actionLog.length`).
5. If only pass is legal, return pass.

### Files

- `packages/game-core/src/ai/simpleAI.ts` — **[NEW]**
- `packages/game-core/src/ai/simpleAI.test.ts` — **[NEW]** (must include: always-legal, full-game completion, no mutation)
- `packages/game-core/src/index.ts` — export `chooseSimpleAIAction`

### Acceptance Criteria

- [ ] AI always returns a legal action.
- [ ] AI completes a full 3-round match (integration test).
- [ ] Random play selection is seeded and deterministic.
- [ ] No React or browser APIs imported.
- [ ] All 70+ tests pass.

---

## Archived: Task 3.7 Detail

## Task 3.7: Expand MVP Card Pool to 60 Cards

### Goal

Expand `packages/game-core/src/cards/cardData.ts` from 20 to 60 cards (15 per faction).
All skill cards must carry real `effects` configs — no more placeholder empty arrays for cards that have skills.
Validation must pass. No unimplemented effect types. Budgets consistent with design tiers.

### Constraints

- Use only implemented effects: `BUFF`, `DAMAGE`, `DESTROY`, `DRAW_DISCARD`, `SUMMON`, `REVIVE`, `LOCK`, `CONDITIONAL_BOOST`.
- Do NOT use `CLEAR_WEATHER` (weather system not yet implemented).
- Do NOT use `MANUAL` targets (no targeting UI yet).
- Automatic target selectors only: `SELF`, `ALLY_LOWEST`, `ALLY_RANDOM`, `ALLY_ROW`, `ENEMY_LOWEST`, `ENEMY_HIGHEST`, `ENEMY_RANDOM`, `ENEMY_ROW`.
- Token card IDs (e.g. `qin-token`, `chu-token`) must appear in `INITIAL_CARDS` so `cardDefinitions` can resolve them.

### Budget Tiers

| Rarity | Budget | Role |
|--------|-------:|------|
| common | 4–6 | Basic filler |
| elite | 7–9 | Efficient unit or small effect |
| hero | 10–12 | Strong build-around |
| legend | 13–15 | Faction finisher |

Effect value reference (PDD §6.2):

| Effect | Est. Value |
|--------|----------:|
| BUFF ally +1 | 1 |
| BUFF ally +2 | 2 |
| BUFF ally +3 | 3 |
| DAMAGE random enemy -2 | 1.5 |
| DAMAGE enemy highest -3 | 3.5 |
| DESTROY enemy lowest | 4 |
| DRAW_DISCARD draw:1 discard:1 | 3.5 |
| DRAW_DISCARD draw:2 discard:1 | 4 |
| SUMMON 1x power-2 token | 2 |
| REVIVE ally maxPower:4 | 4 |
| LOCK enemy | 3 |
| CONDITIONAL_BOOST +2 when behind | ~1.5 |
| CONDITIONAL_BOOST +3 when behind | ~2.25 |

---

### Qin (15 total = 5 existing + 10 new)

Identity: High power, direct removal, pressure, beginner-friendly.

**Update existing:**

| id | change |
|----|--------|
| legalist-officer | add `BUFF ALLY_LOWEST +3` |
| qin-crossbow-formation | add `DAMAGE ENEMY_RANDOM -2` x2 |

**New cards:**

| id | name | type | row | power | rarity | budget | effects |
|----|------|------|-----|------:|--------|-------:|---------|
| qin-spear-guard | Qin Spear Guard | unit | melee | 4 | common | 4 | none |
| qin-siege-engineer | Qin Siege Engineer | unit | siege | 5 | common | 5 | none |
| qin-war-chariot | Qin War Chariot | unit | melee | 7 | elite | 9 | `DAMAGE ENEMY_LOWEST -2` |
| qin-arbalest | Qin Arbalest | unit | ranged | 5 | elite | 9 | `DAMAGE ENEMY_HIGHEST -3` |
| shang-yang | Shang Yang | unit | ranged | 4 | hero | 11 | `BUFF ALLY_ROW(melee) +2` |
| bai-qi | Bai Qi | unit | melee | 9 | legend | 13 | `DESTROY ENEMY_LOWEST` |
| wang-jian | Wang Jian | unit | melee | 8 | hero | 11 | `CONDITIONAL_BOOST SCORE_AHEAD +3` |
| qin-cavalry-charge | Qin Cavalry Charge | special | — | 0 | elite | 8 | `DAMAGE ENEMY_RANDOM -2` x2 |
| qin-conscription | Qin Conscription | special | — | 0 | elite | 7 | `SUMMON qin-token(melee) x2` |
| qin-token | Qin Conscript | unit | melee | 2 | common | 2 | none (token) |

---

### Chu (15 total = 5 existing + 10 new)

Identity: Swarm, token SUMMON, row BUFF, unit-count conditional scaling.

**Update existing:**

| id | change |
|----|--------|
| chu-shaman | add `SUMMON chu-token(melee) x1` |
| chunshen-retainer | add `BUFF ALLY_RANDOM(count:2) +1` |
| xiang-yan | add `CONDITIONAL_BOOST ALLY_UNIT_COUNT_AT_LEAST(count:4) +3` |

**New cards:**

| id | name | type | row | power | rarity | budget | effects |
|----|------|------|-----|------:|--------|-------:|---------|
| chu-footsoldier | Chu Footsoldier | unit | melee | 4 | common | 4 | none |
| chu-shield-bearer | Chu Shield Bearer | unit | melee | 5 | common | 5 | none |
| chu-river-guard | Chu River Guard | unit | siege | 4 | common | 4 | none |
| chu-war-dancer | Chu War Dancer | unit | melee | 3 | elite | 7 | `BUFF ALLY_LOWEST +3` |
| chu-herald | Chu Herald | unit | ranged | 3 | elite | 7 | `SUMMON chu-token(melee) x1` + `BUFF ALLY_LOWEST +1` |
| lord-chunshen | Lord Chunshen | unit | melee | 7 | hero | 11 | `BUFF ALLY_ROW(melee) +1` |
| king-of-chu | King of Chu | unit | melee | 8 | legend | 14 | `CONDITIONAL_BOOST ALLY_UNIT_COUNT_AT_LEAST(count:6) +4` |
| chu-battle-cry | Chu Battle Cry | special | — | 0 | elite | 8 | `SUMMON chu-token(melee) x2` + `BUFF ALLY_LOWEST +1` |
| chu-flood-tactic | Chu Flood Tactic | special | — | 0 | elite | 7 | `BUFF ALLY_ROW(ranged) +2` |
| chu-token | Chu Warrior | unit | melee | 2 | common | 2 | none (token) |

---

### Qi (15 total = 5 existing + 10 new)

Identity: DRAW_DISCARD hand management, DAMAGE enemy highest, resource control.

**Update existing:**

| id | change |
|----|--------|
| jixia-scholar | add `DRAW_DISCARD draw:1 discard:1` |
| guan-zhong-legacy | add `DRAW_DISCARD draw:2 discard:1` |
| sun-bin | add `DAMAGE ENEMY_HIGHEST -3` |
| tian-ji | add `CONDITIONAL_BOOST SCORE_BEHIND +2` + `DRAW_DISCARD draw:1 discard:1` |

**New cards:**

| id | name | type | row | power | rarity | budget | effects |
|----|------|------|-----|------:|--------|-------:|---------|
| qi-spearman | Qi Spearman | unit | melee | 5 | common | 5 | none |
| qi-crossbowman | Qi Crossbowman | unit | ranged | 5 | common | 5 | none |
| qi-siege-crew | Qi Siege Crew | unit | siege | 5 | common | 5 | none |
| jixia-strategist | Jixia Strategist | unit | ranged | 5 | elite | 9 | `DRAW_DISCARD draw:2 discard:1` |
| qi-scout | Qi Scout | unit | ranged | 3 | elite | 7 | `DRAW_DISCARD draw:1 discard:1` + `DAMAGE ENEMY_RANDOM -1` |
| tian-dan | Tian Dan | unit | melee | 6 | hero | 11 | `DAMAGE ENEMY_HIGHEST -3` + `BUFF SELF +1` |
| sun-tzu | Sun Tzu | unit | ranged | 5 | legend | 13 | `DRAW_DISCARD draw:2 discard:1` + `DAMAGE ENEMY_HIGHEST -3` |
| guan-zhong | Guan Zhong | unit | ranged | 6 | hero | 10 | `BUFF ALLY_LOWEST +2` + `DRAW_DISCARD draw:1 discard:1` |
| qi-iron-cavalry | Qi Iron Cavalry | unit | melee | 6 | elite | 8 | `DAMAGE ENEMY_LOWEST -2` |
| plan-of-jixia | Plan of Jixia | special | — | 0 | elite | 8 | `DRAW_DISCARD draw:3 discard:2` |

---

### Zhao (15 total = 5 existing + 10 new)

Identity: CONDITIONAL_BOOST when behind or on opponent pass, LOCK, cavalry BUFF, tempo swings.

**Update existing:**

| id | change |
|----|--------|
| hu-clothing-cavalry | add `BUFF ALLY_ROW(melee) +1` |
| li-mu | add `CONDITIONAL_BOOST SCORE_BEHIND +3` |
| lian-po | add `CONDITIONAL_BOOST OPPONENT_PASSED +2` |
| zhao-raid | add `DAMAGE ENEMY_RANDOM -2` x2 |

**New cards:**

| id | name | type | row | power | rarity | budget | effects |
|----|------|------|-----|------:|--------|-------:|---------|
| zhao-footsoldier | Zhao Footsoldier | unit | melee | 5 | common | 5 | none |
| zhao-archer | Zhao Archer | unit | ranged | 5 | common | 5 | none |
| zhao-siege-crew | Zhao Siege Crew | unit | siege | 5 | common | 5 | none |
| zhao-heavy-cavalry | Zhao Heavy Cavalry | unit | melee | 7 | elite | 9 | `CONDITIONAL_BOOST SCORE_BEHIND +2` |
| zhao-vanguard | Zhao Vanguard | unit | melee | 4 | elite | 7 | `BUFF ALLY_LOWEST +2` |
| zhao-warlord | Zhao Warlord | unit | ranged | 5 | elite | 8 | `LOCK ENEMY_HIGHEST` |
| lin-xiangru | Lin Xiangru | unit | ranged | 6 | hero | 11 | `CONDITIONAL_BOOST SCORE_BEHIND +4` |
| zhao-she | Zhao She | unit | melee | 7 | hero | 10 | `DAMAGE ENEMY_LOWEST -3` |
| king-of-zhao | King of Zhao | unit | melee | 9 | legend | 14 | `CONDITIONAL_BOOST SCORE_BEHIND +3` + `BUFF ALLY_LOWEST +2` |
| zhao-ambush | Zhao Ambush | special | — | 0 | elite | 8 | `DAMAGE ENEMY_RANDOM -2` + `LOCK ENEMY_HIGHEST` |

---

### Execution Steps

1. Update the 9 existing cards that need effect configs (legalist-officer, qin-crossbow-formation, chu-shaman, chunshen-retainer, xiang-yan, jixia-scholar, guan-zhong-legacy, sun-bin, tian-ji, hu-clothing-cavalry, li-mu, lian-po, zhao-raid).
2. Append 10 new Qin cards (including `qin-token`).
3. Append 10 new Chu cards (including `chu-token`).
4. Append 10 new Qi cards.
5. Append 10 new Zhao cards.
6. Run `pnpm test` — all tests must pass.
7. Run `pnpm typecheck` and `pnpm build`.

### Acceptance Checklist

- [ ] `INITIAL_CARDS.length >= 60`
- [ ] Each faction has exactly 15 cards
- [ ] `validateCards(INITIAL_CARDS)` returns `valid: true`, zero errors
- [ ] No card uses `CLEAR_WEATHER` or `MANUAL` targets
- [ ] `qin-token` and `chu-token` present in INITIAL_CARDS (for SUMMON resolution)
- [ ] All budgets within ±2 of tier guideline

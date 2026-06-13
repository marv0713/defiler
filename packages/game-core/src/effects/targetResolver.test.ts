import { describe, it, expect, vi } from "vitest";
import { resolveTargets } from "./targetResolver";
import type { GameState, EffectContext } from "../types";
import type { TargetSelector } from "./effectTypes";

describe("targetResolver", () => {
  const mockContext: EffectContext = {
    sourcePlayerId: "player",
    opponentPlayerId: "opponent",
    random: () => 0.5,
  };

  const createMockGameState = (): GameState => ({
    id: "test",
    seed: "seed",
    status: "playing",
    currentRound: 1,
    currentPlayerId: "player",
    players: {
      player: {
        id: "player",
        faction: "qin",
        deck: [],
        hand: [],
        board: {
          melee: [
            {
              instanceId: "p1",
              cardId: "c1",
              ownerId: "player",
              type: "unit",
              row: "melee",
              currentPower: 5,
              basePower: 5,
              isLocked: false,
              isDestroyed: false,
              modifiers: [],
            },
            {
              instanceId: "p2",
              cardId: "c2",
              ownerId: "player",
              type: "unit",
              row: "melee",
              currentPower: 10,
              basePower: 10,
              isLocked: false,
              isDestroyed: false,
              modifiers: [],
            },
          ],
          ranged: [
            {
              instanceId: "p3",
              cardId: "c3",
              ownerId: "player",
              type: "unit",
              row: "ranged",
              currentPower: 3,
              basePower: 3,
              isLocked: false,
              isDestroyed: false,
              modifiers: [],
            },
          ],
          siege: [],
        },
        graveyard: [],
        hasPassed: false,
        roundWins: 0,
      },
      opponent: {
        id: "opponent",
        faction: "chu",
        deck: [],
        hand: [],
        board: {
          melee: [
            {
              instanceId: "o1",
              cardId: "oc1",
              ownerId: "opponent",
              type: "unit",
              row: "melee",
              currentPower: 8,
              basePower: 8,
              isLocked: false,
              isDestroyed: false,
              modifiers: [],
            },
          ],
          ranged: [],
          siege: [
            {
              instanceId: "o2",
              cardId: "oc2",
              ownerId: "opponent",
              type: "unit",
              row: "siege",
              currentPower: 12,
              basePower: 12,
              isLocked: false,
              isDestroyed: false,
              modifiers: [],
            },
            {
              instanceId: "o3",
              cardId: "oc3",
              ownerId: "opponent",
              type: "unit",
              row: "siege",
              currentPower: 1,
              basePower: 1,
              isLocked: false,
              isDestroyed: false,
              modifiers: [],
            },
          ],
        },
        graveyard: [],
        hasPassed: false,
        roundWins: 0,
      },
    },
    actionLog: [],
    cardDefinitions: {},
  });

  it("resolves SELF selector", () => {
    const state = createMockGameState();
    const selector: TargetSelector = { type: "SELF" };
    const targets = resolveTargets(state, mockContext, selector, "p1");
    expect(targets).toHaveLength(1);
    expect(targets[0].instanceId).toBe("p1");
  });

  it("resolves ALLY_LOWEST selector", () => {
    const state = createMockGameState();
    const selector: TargetSelector = { type: "ALLY_LOWEST" };
    const targets = resolveTargets(state, mockContext, selector);
    expect(targets).toHaveLength(1);
    expect(targets[0].instanceId).toBe("p3"); // Power 3 is lowest on player board
  });

  it("resolves ALLY_ROW selector", () => {
    const state = createMockGameState();
    const selector: TargetSelector = { type: "ALLY_ROW", row: "melee" };
    const targets = resolveTargets(state, mockContext, selector);
    expect(targets).toHaveLength(2);
    expect(targets.map((t) => t.instanceId)).toContain("p1");
    expect(targets.map((t) => t.instanceId)).toContain("p2");
  });

  it("resolves ENEMY_LOWEST selector", () => {
    const state = createMockGameState();
    const selector: TargetSelector = { type: "ENEMY_LOWEST" };
    const targets = resolveTargets(state, mockContext, selector);
    expect(targets).toHaveLength(1);
    expect(targets[0].instanceId).toBe("o3"); // Power 1 is lowest on opponent board
  });

  it("resolves ENEMY_HIGHEST selector", () => {
    const state = createMockGameState();
    const selector: TargetSelector = { type: "ENEMY_HIGHEST" };
    const targets = resolveTargets(state, mockContext, selector);
    expect(targets).toHaveLength(1);
    expect(targets[0].instanceId).toBe("o2"); // Power 12 is highest on opponent board
  });

  it("ignores destroyed cards", () => {
    const state = createMockGameState();
    state.players.opponent.board.siege[1].isDestroyed = true; // Destroy o3 (power 1)
    const selector: TargetSelector = { type: "ENEMY_LOWEST" };
    const targets = resolveTargets(state, mockContext, selector);
    expect(targets).toHaveLength(1);
    expect(targets[0].instanceId).toBe("o1"); // Now o1 (power 8) is lowest
  });

  it("resolves ALLY_RANDOM selector", () => {
    const state = createMockGameState();
    // 3 units on player board: p1 (5), p2 (10), p3 (3)
    // mockContext.random returns 0.5
    // 0.5 * 3 = 1.5 -> floor is index 1 -> p2
    const selector: TargetSelector = { type: "ALLY_RANDOM", count: 1 };
    const targets = resolveTargets(state, mockContext, selector);
    expect(targets).toHaveLength(1);
    expect(targets[0].instanceId).toBe("p2");
  });

  it("returns multiple targets for ALLY_RANDOM with count > 1", () => {
    const state = createMockGameState();
    const selector: TargetSelector = { type: "ALLY_RANDOM", count: 2 };
    
    // We need to control random for multiple calls
    let callCount = 0;
    const randomVals = [0.1, 0.9]; // 0.1 * 3 = 0.3 (idx 0), 0.9 * 2 = 1.8 (idx 1 after removal)
    const controlledContext = {
      ...mockContext,
      random: () => randomVals[callCount++],
    };

    const targets = resolveTargets(state, controlledContext, selector);
    expect(targets).toHaveLength(2);
    // Initial units: [p1, p2, p3]
    // First call 0.1 picks idx 0: p1. Remaining: [p2, p3]
    // Second call 0.9 picks idx 1: p3.
    expect(targets.map(t => t.instanceId)).toEqual(["p1", "p3"]);
  });

  it("resolves ENEMY_ROW selector", () => {
    const state = createMockGameState();
    const selector: TargetSelector = { type: "ENEMY_ROW", row: "siege" };
    const targets = resolveTargets(state, mockContext, selector);
    expect(targets).toHaveLength(2);
    expect(targets.map((t) => t.instanceId)).toContain("o2");
    expect(targets.map((t) => t.instanceId)).toContain("o3");
  });
});

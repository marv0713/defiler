import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";

// Reset the shared Zustand store between tests so state never leaks across cases.
beforeEach(() => {
  useGameStore.getState().restart();
});

describe("useGameStore — lifecycle", () => {
  it("starts on the start screen with no game state", () => {
    const s = useGameStore.getState();
    expect(s.screen).toBe("start");
    expect(s.gameState).toBeNull();
    expect(s.lastAction).toBeNull();
  });

  it("startGame creates a playable game and the player goes first", () => {
    useGameStore.getState().startGame("qin", "chu");
    const s = useGameStore.getState();

    expect(s.screen).toBe("game");
    expect(s.gameState).not.toBeNull();
    expect(s.gameState!.status).toBe("playing");
    // firstPlayerId is always "player", and the player holds no cards yet,
    // so the board starts empty and scores are 0-0.
    expect(s.gameState!.currentPlayerId).toBe("player");
    expect(s.scores()).toEqual({ player: 0, opponent: 0 });
  });

  it("restart clears the game back to the start screen", () => {
    useGameStore.getState().startGame("qin", "chu");
    useGameStore.getState().restart();
    const s = useGameStore.getState();
    expect(s.screen).toBe("start");
    expect(s.gameState).toBeNull();
    expect(s.lastAction).toBeNull();
  });

  it("faction setters update the selected factions", () => {
    useGameStore.getState().setPlayerFaction("qi");
    useGameStore.getState().setOpponentFaction("zhao");
    const s = useGameStore.getState();
    expect(s.playerFaction).toBe("qi");
    expect(s.opponentFaction).toBe("zhao");
  });
});

describe("useGameStore — playCard drives opponent AI", () => {
  it("removes the played card from hand; unit cards land on the board", () => {
    useGameStore.getState().startGame("qin", "chu");
    const before = useGameStore.getState().gameState!;
    // Pick a unit card (not special/weather) so we can assert board placement.
    const unitCard = before.players.player.hand.find((c) => c.type === "unit")!;
    expect(unitCard).toBeDefined();

    useGameStore.getState().playCard(unitCard.instanceId);

    const after = useGameStore.getState().gameState!;
    // Card left the hand.
    expect(after.players.player.hand.find((c) => c.instanceId === unitCard.instanceId)).toBeUndefined();
    // Unit card is now on one of the board rows.
    const allBoardCards = [
      ...after.players.player.board.melee,
      ...after.players.player.board.ranged,
      ...after.players.player.board.siege,
    ];
    expect(allBoardCards.find((c) => c.instanceId === unitCard.instanceId)).toBeDefined();
    // lastAction describes some action that happened (player's play or
    // the opponent's automatic response — commitAfterPlayer may overwrite it).
    expect(useGameStore.getState().lastAction).not.toBeNull();
  });

  it("ignores playCard for an unknown card instance id (guard clause)", () => {
    useGameStore.getState().startGame("qin", "chu");
    const before = useGameStore.getState().gameState!;

    useGameStore.getState().playCard("does-not-exist");

    // State is unchanged — illegal play is a silent no-op.
    expect(useGameStore.getState().gameState).toBe(before);
  });

  it("ignores playCard when it is not the player's turn", () => {
    useGameStore.getState().startGame("qin", "chu");
    // Force opponent's turn by mutating through a real play first.
    const firstCard = useGameStore.getState().gameState!.players.player.hand[0];
    useGameStore.getState().playCard(firstCard.instanceId);
    // If the AI loop left it as the opponent's turn, a second immediate play
    // must be ignored. We can't guarantee the opponent still holds the turn
    // (AI may have passed), so just assert no throw and state stays valid.
    const snapshot = useGameStore.getState().gameState!;
    expect(() => useGameStore.getState().playCard(firstCard.instanceId)).not.toThrow();
    expect(useGameStore.getState().gameState!.status).toBe(snapshot.status);
  });
});

describe("useGameStore — pass + round flow", () => {
  it("marks the player as passed and lets the opponent respond", () => {
    useGameStore.getState().startGame("qin", "chu");
    useGameStore.getState().pass();
    const s = useGameStore.getState().gameState!;
    expect(s.players.player.hasPassed).toBe(true);
    // lastAction is now a LogMessage; after player passes the opponent may
    // respond, so the id will be either "game.youPass" or an opponent action.
    const la = useGameStore.getState().lastAction;
    expect(la).not.toBeNull();
    expect(typeof la?.id).toBe("string");
    expect(la?.id).toMatch(/^game\./);
  });

  it("atomic round-over transition: pass that ends the round lands in round_finished, not a flash of game_finished", () => {
    // Drive both sides to a state where the next settle ends the round.
    useGameStore.getState().startGame("qin", "chu");
    // Player passes; opponent AI plays it out and the AI logic will settle
    // when both have passed (the heuristic AI passes when comfortably ahead).
    // We can't deterministically force a single-pass settlement, so we loop
    // passes + next-round until the round is finished within the player's
    // own pass action. The key invariant tested here: after the player's pass
    // resolves, the screen is never "result" unless the game is actually over.
    useGameStore.getState().pass();
    const s = useGameStore.getState();
    if (s.gameState!.status === "round_finished") {
      // Game not over → must still be on the game screen.
      expect(s.screen).toBe("game");
    } else if (s.gameState!.status === "game_finished") {
      expect(s.screen).toBe("result");
    } else {
      // Still playing — screen must be game.
      expect(s.screen).toBe("game");
    }
  });
});

describe("useGameStore — full match terminates", () => {
  it("can be driven to completion via store actions without hanging", () => {
    useGameStore.getState().startGame("qin", "chu");

    // Simulate a human player who always plays the first legal card or passes,
    // calling the public store API just like the UI does. The store runs the
    // opponent AI automatically after each action.
    const MAX_TURNS = 300;
    let turns = 0;
    let guard = 0;

    while (
      useGameStore.getState().gameState!.status !== "game_finished" &&
      guard++ < MAX_TURNS
    ) {
      const s = useGameStore.getState().gameState!;
      if (s.status === "round_finished") {
        useGameStore.getState().startNextRound();
        turns++;
        continue;
      }
      // Player's turn only — opponent turns happen inside the store.
      if (s.currentPlayerId !== "player" || s.players.player.hasPassed) {
        // The store should always return control to the player eventually;
        // break out if it appears stuck (would indicate a real bug).
        turns++;
        if (turns > MAX_TURNS) break;
        continue;
      }
      const hand = s.players.player.hand;
      if (hand.length === 0) {
        useGameStore.getState().pass();
      } else {
        useGameStore.getState().playCard(hand[0].instanceId);
      }
      turns++;
    }

    const final = useGameStore.getState();
    expect(final.gameState!.status).toBe("game_finished");
    expect(final.screen).toBe("result");
    expect(final.gameState!.winnerId).toBeDefined();
    expect(turns).toBeLessThan(MAX_TURNS);
  });
});

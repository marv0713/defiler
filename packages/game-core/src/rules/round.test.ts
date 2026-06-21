import { describe, expect, it } from "vitest";
import { settleRound, startNextRound } from "../index";
import type { CardInstance, GameState, PlayerId, PlayerState, Row } from "../index";

function createCard(instanceId: string, currentPower: number): CardInstance {
  return {
    instanceId,
    cardId: instanceId,
    ownerId: "player",
    type: "unit",
    row: "melee",
    currentPower,
    basePower: currentPower,
    isLocked: false,
    isDestroyed: false,
    modifiers: [],
  };
}

function createPlayer(
  id: PlayerId,
  rows: Partial<Record<Row, CardInstance[]>>,
  roundWins = 0,
): PlayerState {
  return {
    id,
    faction: id === "player" ? "qin" : "chu",
    deck: [],
    hand: [],
    board: {
      melee: rows.melee ?? [],
      ranged: rows.ranged ?? [],
      siege: rows.siege ?? [],
    },
    graveyard: [],
    hasPassed: true,
    roundWins,
  };
}

function createState(player: PlayerState, opponent: PlayerState): GameState {
  return {
    id: "game-1",
    seed: "seed-1",
    status: "playing",
    currentRound: 1,
    currentPlayerId: "player",
    players: {
      player,
      opponent,
    },
    actionLog: [],
    cardDefinitions: {},
  };
}

describe("round flow", () => {
  it("settles a round and increments the higher scoring player's wins", () => {
    const state = createState(
      createPlayer("player", {
        melee: [createCard("player-card", 8)],
      }),
      createPlayer("opponent", {
        ranged: [createCard("opponent-card", 5)],
      }),
    );

    const nextState = settleRound(state);

    expect(nextState.status).toBe("round_finished");
    expect(nextState.roundWinnerId).toBe("player");
    expect(nextState.players.player.roundWins).toBe(1);
    expect(nextState.players.opponent.roundWins).toBe(0);
  });

  it("finishes the match when a player reaches two round wins", () => {
    const state = createState(
      createPlayer(
        "player",
        {
          melee: [createCard("player-card", 8)],
        },
        1,
      ),
      createPlayer("opponent", {
        ranged: [createCard("opponent-card", 5)],
      }),
    );

    const nextState = settleRound(state);

    expect(nextState.status).toBe("game_finished");
    expect(nextState.winnerId).toBe("player");
    expect(nextState.players.player.roundWins).toBe(2);
  });

  it("starts the next round by moving board cards to graveyard and clearing pass state", () => {
    const state = settleRound(
      createState(
        createPlayer("player", {
          melee: [createCard("player-card", 8)],
        }),
        createPlayer("opponent", {
          ranged: [createCard("opponent-card", 5)],
        }),
      ),
    );

    const nextState = startNextRound(state);

    expect(nextState.status).toBe("playing");
    expect(nextState.currentRound).toBe(2);
    expect(nextState.currentPlayerId).toBe("player");
    expect(nextState.roundWinnerId).toBeUndefined();
    expect(nextState.players.player.board.melee).toEqual([]);
    expect(nextState.players.opponent.board.ranged).toEqual([]);
    expect(nextState.players.player.graveyard).toEqual([
      expect.objectContaining({
        instanceId: "player-card",
      }),
    ]);
    expect(nextState.players.opponent.graveyard).toEqual([
      expect.objectContaining({
        instanceId: "opponent-card",
      }),
    ]);
    expect(nextState.players.player.hasPassed).toBe(false);
    expect(nextState.players.opponent.hasPassed).toBe(false);
  });
  it("declares opponent winner when round 3 ends in a draw", () => {
    const state = {
      ...createState(
        createPlayer("player", { melee: [createCard("p", 5)] }),
        createPlayer("opponent", { melee: [createCard("o", 5)] }),
      ),
      currentRound: 3,
    };

    const nextState = settleRound(state);

    expect(nextState.status).toBe("game_finished");
    expect(nextState.winnerId).toBe("opponent");
    // roundWinnerId is undefined because the round itself was a draw
    expect(nextState.roundWinnerId).toBeUndefined();
    // opponent's roundWins must be incremented so winnerId and roundWins are consistent
    expect(nextState.players.opponent.roundWins).toBe(1);
    expect(nextState.players.player.roundWins).toBe(0);
  });

  it("does not apply the draw tiebreaker before round 3", () => {
    // Round 1 draw → round_finished, game continues
    const state = createState(
      createPlayer("player", { melee: [createCard("p", 5)] }),
      createPlayer("opponent", { melee: [createCard("o", 5)] }),
    );

    const nextState = settleRound(state);

    expect(nextState.status).toBe("round_finished");
    expect(nextState.winnerId).toBeUndefined();
  });

  it("awards the match to the round-win leader on a round-3 draw", () => {
    // Player won round 1 (1-0), then rounds 2 and 3 both drew.
    // The old tiebreaker wrongly gave the match to the opponent despite the
    // player having actually won a round. The fix awards it to the leader.
    const state = {
      ...createState(
        createPlayer("player", { melee: [createCard("p", 5)] }, 1),
        createPlayer("opponent", { melee: [createCard("o", 5)] }, 0),
      ),
      currentRound: 3,
    };

    const nextState = settleRound(state);

    expect(nextState.status).toBe("game_finished");
    expect(nextState.winnerId).toBe("player");
    // Round itself was a draw — no roundWinnerId, no roundWin increment.
    expect(nextState.roundWinnerId).toBeUndefined();
    expect(nextState.players.player.roundWins).toBe(1);
    expect(nextState.players.opponent.roundWins).toBe(0);
  });

  it("falls back to opponent-wins when round wins are also tied on round 3", () => {
    // 0-0 going into round 3, round 3 draws → true deadlock.
    // Opponent wins as the MVP termination fallback; roundWins stay consistent.
    const state = {
      ...createState(
        createPlayer("player", { melee: [createCard("p", 5)] }, 0),
        createPlayer("opponent", { melee: [createCard("o", 5)] }, 0),
      ),
      currentRound: 3,
    };

    const nextState = settleRound(state);

    expect(nextState.status).toBe("game_finished");
    expect(nextState.winnerId).toBe("opponent");
    expect(nextState.players.opponent.roundWins).toBe(1);
    expect(nextState.players.player.roundWins).toBe(0);
  });
});

describe("per-round draw (Gwent rules)", () => {
  it("draws +2 cards for each player when entering round 2", () => {
    const deckCards = [
      createCard("d1", 3),
      createCard("d2", 4),
      createCard("d3", 5),
    ];
    const playerWithDeck: PlayerState = {
      id: "player",
      faction: "qin",
      deck: [...deckCards],
      hand: [],
      board: { melee: [createCard("p", 5)], ranged: [], siege: [] },
      graveyard: [],
      hasPassed: true,
      roundWins: 1,
    };
    const opponentWithDeck: PlayerState = {
      id: "opponent",
      faction: "chu",
      deck: [createCard("o1", 2), createCard("o2", 2)],
      hand: [],
      board: { melee: [createCard("o", 3)], ranged: [], siege: [] },
      graveyard: [],
      hasPassed: true,
      roundWins: 0,
    };
    const state: GameState = {
      ...createState(playerWithDeck, opponentWithDeck),
      status: "round_finished",
      currentRound: 1,
      roundWinnerId: "player",
    };

    const nextState = startNextRound(state);

    expect(nextState.currentRound).toBe(2);
    // player had 3 deck cards; draws 2 → hand gains 2, deck shrinks by 2
    expect(nextState.players.player.hand).toHaveLength(2);
    expect(nextState.players.player.deck).toHaveLength(1);
    // opponent had 2 deck cards; draws 2 → hand gains 2, deck empty
    expect(nextState.players.opponent.hand).toHaveLength(2);
    expect(nextState.players.opponent.deck).toHaveLength(0);
  });

  it("draws +1 card for each player when entering round 3", () => {
    const playerWithDeck: PlayerState = {
      id: "player",
      faction: "qin",
      deck: [createCard("d1", 5), createCard("d2", 6)],
      hand: [createCard("h1", 3)],
      board: { melee: [], ranged: [], siege: [] },
      graveyard: [],
      hasPassed: true,
      roundWins: 1,
    };
    const opponentWithDeck: PlayerState = {
      id: "opponent",
      faction: "chu",
      deck: [createCard("od1", 4)],
      hand: [],
      board: { melee: [], ranged: [], siege: [] },
      graveyard: [],
      hasPassed: true,
      roundWins: 1,
    };
    const state: GameState = {
      ...createState(playerWithDeck, opponentWithDeck),
      status: "round_finished",
      currentRound: 2,
      roundWinnerId: undefined,
    };

    const nextState = startNextRound(state);

    expect(nextState.currentRound).toBe(3);
    // player hand was 1; draws 1 → now 2; deck was 2 → now 1
    expect(nextState.players.player.hand).toHaveLength(2);
    expect(nextState.players.player.deck).toHaveLength(1);
    // opponent hand was 0; draws 1 → now 1; deck was 1 → now 0
    expect(nextState.players.opponent.hand).toHaveLength(1);
    expect(nextState.players.opponent.deck).toHaveLength(0);
  });

  it("draws all remaining cards when deck has fewer than the draw count", () => {
    const playerWithDeck: PlayerState = {
      id: "player",
      faction: "qin",
      deck: [createCard("only", 5)], // only 1 card left; draw count is 2
      hand: [],
      board: { melee: [], ranged: [], siege: [] },
      graveyard: [],
      hasPassed: true,
      roundWins: 0,
    };
    const opponentWithDeck: PlayerState = {
      id: "opponent",
      faction: "chu",
      deck: [],
      hand: [],
      board: { melee: [], ranged: [], siege: [] },
      graveyard: [],
      hasPassed: true,
      roundWins: 0,
    };
    const state: GameState = {
      ...createState(playerWithDeck, opponentWithDeck),
      status: "round_finished",
      currentRound: 1,
      roundWinnerId: undefined,
    };

    const nextState = startNextRound(state); // entering round 2 → drawCount = 2

    // player only had 1 card → draws that 1, deck empty
    expect(nextState.players.player.hand).toHaveLength(1);
    expect(nextState.players.player.deck).toHaveLength(0);
    // opponent had 0 → still 0
    expect(nextState.players.opponent.hand).toHaveLength(0);
  });
});

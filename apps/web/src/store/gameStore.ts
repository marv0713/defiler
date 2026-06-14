import { create } from "zustand";
import {
  createInitialGameState,
  applyAction,
  chooseSimpleAIAction,
  INITIAL_CARDS,
  calculateScores,
} from "@warring-states/game-core";
import type { GameState, Faction } from "@warring-states/game-core";

export type AppScreen = "start" | "game" | "result";

interface GameStore {
  screen: AppScreen;
  gameState: GameState | null;
  lastAction: string | null;
  autoplay: boolean;
  playerFaction: Faction;
  opponentFaction: Faction;

  startGame: (playerFaction: Faction, opponentFaction: Faction) => void;
  setPlayerFaction: (f: Faction) => void;
  setOpponentFaction: (f: Faction) => void;
  tick: () => void;
  toggleAutoplay: () => void;
  restart: () => void;
  scores: () => { player: number; opponent: number } | null;
}

function buildDeck(faction: Faction) {
  return INITIAL_CARDS.filter((c) => c.faction === faction);
}

function seedFromNow() {
  return `game-${Date.now()}`;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "start",
  gameState: null,
  lastAction: null,
  autoplay: false,
  playerFaction: "qin",
  opponentFaction: "chu",

  startGame(playerFaction, opponentFaction) {
    const state = createInitialGameState({
      seed: seedFromNow(),
      playerFaction,
      opponentFaction,
      playerDeck: buildDeck(playerFaction),
      opponentDeck: buildDeck(opponentFaction),
      firstPlayerId: "player",
    });
    set({ screen: "game", gameState: state, lastAction: null, autoplay: false });
  },

  setPlayerFaction(f) { set({ playerFaction: f }); },
  setOpponentFaction(f) { set({ opponentFaction: f }); },

  tick() {
    const { gameState } = get();
    if (!gameState) return;

    if (gameState.status === "game_finished") {
      set({ screen: "result", autoplay: false });
      return;
    }

    if (gameState.status === "round_finished") {
      const next = applyAction(gameState, { type: "START_NEXT_ROUND" });
      set({ gameState: next, lastAction: "⚔️ Round starts" });
      return;
    }

    // AI picks action for the current player
    const current = gameState.currentPlayerId;
    const action = chooseSimpleAIAction(gameState, current);
    const next = applyAction(gameState, action);

    const label =
      action.type === "PASS"
        ? `${current === "player" ? "🔴" : "🔵"} ${current} passes`
        : `${current === "player" ? "🔴" : "🔵"} ${current} plays a card`;

    set({ gameState: next, lastAction: label });

    if (next.status === "game_finished") {
      set({ screen: "result", autoplay: false });
    }
  },

  toggleAutoplay() {
    set((s) => ({ autoplay: !s.autoplay }));
  },

  restart() {
    set({ screen: "start", gameState: null, lastAction: null, autoplay: false });
  },

  scores() {
    const { gameState } = get();
    if (!gameState) return null;
    return calculateScores(gameState);
  },
}));

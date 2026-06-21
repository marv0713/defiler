import { chooseNormalAIAction } from "../ai/normalAI";
import { INITIAL_CARDS } from "../cards/cardData";
import { DECK_SIZE } from "../constants";
import type { GameAction } from "../rules/actions";
import { createInitialGameState } from "../rules/gameInit";
import { applyAction } from "../rules/reducer";
import { calculateScores } from "../rules/scoring";
import type {
  CardDefinition,
  Faction,
  GameState,
  PlayerId,
} from "../types";

export type SimulateGameStoppedReason = "game_finished" | "max_turns";

export interface SimulateGameConfig {
  seed: string;
  playerFaction: Faction;
  opponentFaction: Faction;
  playerDeck?: CardDefinition[];
  opponentDeck?: CardDefinition[];
  firstPlayerId?: PlayerId;
  maxTurns?: number;
  chooseAction?: (state: GameState, playerId: PlayerId) => GameAction;
}

export interface SimulateActionSummary {
  total: number;
  byType: Record<GameAction["type"], number>;
  byPlayer: Record<PlayerId, number>;
}

export interface SimulateGameResult {
  finalState: GameState;
  winner?: PlayerId;
  rounds: number;
  turns: number;
  finalScores: Record<PlayerId, number>;
  roundWins: Record<PlayerId, number>;
  actionSummary: SimulateActionSummary;
  stoppedReason: SimulateGameStoppedReason;
}

const DEFAULT_MAX_TURNS = 500;

function buildDefaultDeck(faction: Faction): CardDefinition[] {
  const pool = INITIAL_CARDS.filter((card) => card.faction === faction);
  // Fill to DECK_SIZE by cycling through the pool (Gwent-style 25-card deck).
  const deck: CardDefinition[] = [];
  while (deck.length < DECK_SIZE) {
    deck.push(...pool.slice(0, DECK_SIZE - deck.length));
  }
  return deck;
}

function createEmptyActionSummary(): SimulateActionSummary {
  return {
    total: 0,
    byType: {
      PLAY_CARD: 0,
      PASS: 0,
      START_NEXT_ROUND: 0,
      RESTART_GAME: 0,
    },
    byPlayer: {
      player: 0,
      opponent: 0,
    },
  };
}

function summarizeActions(state: GameState): SimulateActionSummary {
  const summary = createEmptyActionSummary();

  for (const entry of state.actionLog) {
    const actionType = entry.message as GameAction["type"];
    summary.total += 1;
    summary.byType[actionType] += 1;

    if (entry.playerId) {
      summary.byPlayer[entry.playerId] += 1;
    }
  }

  return summary;
}

export function simulateGame(config: SimulateGameConfig): SimulateGameResult {
  const chooseAction = config.chooseAction ?? chooseNormalAIAction;
  const maxTurns = config.maxTurns ?? DEFAULT_MAX_TURNS;

  let state = createInitialGameState({
    seed: config.seed,
    playerFaction: config.playerFaction,
    opponentFaction: config.opponentFaction,
    playerDeck: config.playerDeck ?? buildDefaultDeck(config.playerFaction),
    opponentDeck: config.opponentDeck ?? buildDefaultDeck(config.opponentFaction),
    firstPlayerId: config.firstPlayerId ?? "player",
  });

  let turns = 0;

  while (state.status !== "game_finished" && turns < maxTurns) {
    const action =
      state.status === "round_finished"
        ? { type: "START_NEXT_ROUND" as const }
        : chooseAction(state, state.currentPlayerId);

    state = applyAction(state, action);
    turns += 1;
  }

  return {
    finalState: state,
    winner: state.winnerId,
    rounds: state.currentRound,
    turns,
    finalScores: calculateScores(state),
    roundWins: {
      player: state.players.player.roundWins,
      opponent: state.players.opponent.roundWins,
    },
    actionSummary: summarizeActions(state),
    stoppedReason: state.status === "game_finished" ? "game_finished" : "max_turns",
  };
}

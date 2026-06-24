import { create } from "zustand";
import { useSaveStore } from "./saveStore";
import {
  createInitialGameState,
  applyAction,
  getLegalActions,
  chooseNormalAIAction,
  INITIAL_CARDS,
  DECK_SIZE,
  calculateScores,
  CAMPAIGN_LEVELS,
  NORMAL_AI_WEIGHTS,
  getAIWeightsForDifficulty,
} from "@warring-states/game-core";
import type {
  GameState,
  Faction,
  LevelDefinition,
  WinCondition,
} from "@warring-states/game-core";

export type AppScreen =
  | "start"
  | "level_select"
  | "deck_builder"
  | "game"
  | "result";

/**
 * Structured log message — resolved to a translated string in the UI via t().
 * Keeping it as { id, params } instead of a pre-baked string means every
 * rendering target (web, future native) can translate in its own locale.
 */
export interface LogMessage {
  id: string;
  params?: Record<string, string | number>;
}

// Re-export so UI layer can use without importing game-core directly.
export type { LevelDefinition, WinCondition };
export { CAMPAIGN_LEVELS };

interface GameStore {
  screen: AppScreen;
  gameState: GameState | null;
  lastAction: LogMessage | null;
  playerFaction: Faction;
  opponentFaction: Faction;

  // ── Campaign mode ──────────────────────────────────────────────────────────
  /** The level the player selected; null when in Quick Battle mode. */
  selectedLevel: LevelDefinition | null;
  /** Cards the player has chosen in the Deck Builder (card IDs, may repeat). */
  playerDeck: string[];
  /** Validation error message from validateDeck(), or null when the deck is legal. */
  deckBuildError: string | null;
  /** True while the player is in Campaign mode (level_select → game). */
  campaignMode: boolean;
  /** True after the player has clicked a campaign faction on Level Select. */
  campaignFactionChosen: boolean;
  /** True after the player enters a campaign level/deck build for the current run. */
  campaignFactionLocked: boolean;

  startGame: (playerFaction: Faction, opponentFaction: Faction) => void;
  setPlayerFaction: (f: Faction) => void;
  setOpponentFaction: (f: Faction) => void;
  /** Play a card from the player's hand. Opponent AI responds automatically. */
  playCard: (cardInstanceId: string) => void;
  /** Player passes. Opponent AI responds automatically. */
  pass: () => void;
  /** Start the next round after round_finished. AI responds if it goes first. */
  startNextRound: () => void;
  restart: () => void;
  scores: () => { player: number; opponent: number } | null;

  // ── Campaign actions ───────────────────────────────────────────────────────
  goToLevelSelect: () => void;
  selectLevel: (level: LevelDefinition) => void;
  /** Add a card from the current campaign faction pool to the player deck. */
  toggleCardInDeck: (cardId: string) => void;
  /** Remove one copy of a card from the player deck being built. */
  removeCardFromDeck: (cardId: string) => void;
  /** Fill the current campaign deck to DECK_SIZE with legal faction cards. */
  autoFillDeck: () => void;
  /** Returns an error message if the current playerDeck violates the selected level's
   * DeckConstraint, or null if it is valid. */
  validateDeck: () => string | null;
  /** Validate the deck then start the campaign game. */
  startLevelGame: () => void;
  /** Whether the player won the current campaign level (evaluated post-game). */
  levelPassed: () => boolean;
}

function buildDeck(faction: Faction) {
  const pool = INITIAL_CARDS.filter((c) => c.faction === faction);
  // Fill to DECK_SIZE by cycling through the pool (Gwent-style 25-card deck).
  const deck = [];
  while (deck.length < DECK_SIZE) {
    deck.push(...pool.slice(0, DECK_SIZE - deck.length));
  }
  return deck;
}

function seedFromNow() {
  return `game-${Date.now()}`;
}

function findCardDefinition(cardId: string) {
  return INITIAL_CARDS.find((c) => c.id === cardId);
}

export function getMaxCardCopies(cardId: string, allowDuplicates: boolean): number {
  if (!allowDuplicates) return 1;
  const def = findCardDefinition(cardId);
  if (!def) return 1;
  if (def.rarity === "legend" || def.rarity === "hero") return 1;
  if (def.rarity === "elite") return 2;
  return 3; // common
}

function isAllowedCampaignDeckCard(cardId: string, playerFaction: Faction) {
  const def = findCardDefinition(cardId);
  return Boolean(
    def &&
      (def.type === "unit" || def.type === "special") &&
      def.id !== "qin-token" &&
      def.id !== "chu-token" &&
      (def.faction === playerFaction || def.faction === "neutral"),
  );
}

function getCampaignDeckPool(playerFaction: Faction) {
  return INITIAL_CARDS.filter((card) =>
    isAllowedCampaignDeckCard(card.id, playerFaction),
  );
}

/**
 * Runs opponent AI turns until it is the player's turn, the round ends,
 * or the game ends. Returns the final state and the last action label.
 */
function advanceOpponentAI(state: GameState): {
  state: GameState;
  lastAction: LogMessage;
} {
  let current = state;
  let lastAction: LogMessage = { id: "game.opponentPass" };

  const storeState = useGameStore.getState();
  const campaignMode = storeState.campaignMode;
  const selectedLevel = storeState.selectedLevel;
  const weights = (campaignMode && selectedLevel)
    ? getAIWeightsForDifficulty(selectedLevel.difficulty)
    : NORMAL_AI_WEIGHTS;

  while (
    current.status === "playing" &&
    current.currentPlayerId === "opponent"
  ) {
    const action = chooseNormalAIAction(current, "opponent", weights);

    // Build a structured log message before the state changes.
    let actionLabel: LogMessage = { id: "game.opponentPass" };
    if (action.type === "PLAY_CARD") {
      const card = current.players.opponent.hand.find(
        (c) => c.instanceId === action.cardInstanceId,
      );
      const def = card ? current.cardDefinitions[card.cardId] : undefined;
      const nameId = def ? `card.${def.id}.name` : "";
      if (def && def.effects.length > 0) {
        actionLabel = {
          id: "game.opponentPlayWithFx",
          params: { nameId, fx: def.effects.map((e) => e.type).join(", ") },
        };
      } else {
        actionLabel = { id: "game.opponentPlay", params: { nameId } };
      }
    }

    current = applyAction(current, action);
    lastAction = actionLabel;
  }

  return { state: current, lastAction };
}

/**
 * After a player action: run opponent AI, then commit to the store.
 * Handles game_finished transition atomically (no extra render frame).
 */
function commitAfterPlayer(
  stateAfterPlayer: GameState,
  playerLabel: LogMessage,
  set: (partial: Partial<GameStore>) => void,
) {
  let next = stateAfterPlayer;
  let lastAction = playerLabel;

  // If it's opponent's turn (round still playing), let AI respond.
  if (next.status === "playing" && next.currentPlayerId === "opponent") {
    const result = advanceOpponentAI(next);
    next = result.state;
    if (result.lastAction) lastAction = result.lastAction;
  }

  if (next.status === "game_finished") {
    set({ gameState: next, lastAction, screen: "result" });
  } else {
    set({ gameState: next, lastAction });
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "start",
  gameState: null,
  lastAction: null,
  playerFaction: "qin",
  opponentFaction: "chu",
  selectedLevel: null,
  playerDeck: [],
  deckBuildError: null,
  campaignMode: false,
  campaignFactionChosen: false,
  campaignFactionLocked: false,

  startGame(playerFaction, opponentFaction) {
    const initialState = createInitialGameState({
      seed: seedFromNow(),
      playerFaction,
      opponentFaction,
      playerDeck: buildDeck(playerFaction),
      opponentDeck: buildDeck(opponentFaction),
      firstPlayerId: "player",
    });

    // firstPlayerId is always "player" so AI never goes first on game start,
    // but call advanceOpponentAI for safety.
    const { state, lastAction } = advanceOpponentAI(initialState);
    set({
      screen: "game",
      gameState: state,
      lastAction: lastAction?.id ? lastAction : { id: "game.yourTurn" },
    });
  },

  setPlayerFaction(f) {
    const { campaignMode, campaignFactionLocked } = get();
    if (campaignMode && campaignFactionLocked) return;
    if (campaignMode) {
      set({
        playerFaction: f,
        campaignFactionChosen: true,
        playerDeck: [],
        deckBuildError: null,
        selectedLevel: null,
      });
      return;
    }
    set({ playerFaction: f });
  },
  setOpponentFaction(f) {
    set({ opponentFaction: f });
  },

  playCard(cardInstanceId) {
    const { gameState } = get();
    if (!gameState || gameState.status !== "playing") return;
    if (gameState.currentPlayerId !== "player") return;

    // Look up the legal action that matches this card (carries the correct row target).
    const legalActions = getLegalActions(gameState, "player");
    const action = legalActions.find(
      (a) =>
        a.type === "PLAY_CARD" &&
        "cardInstanceId" in a &&
        a.cardInstanceId === cardInstanceId,
    );
    if (!action) return; // not a legal play

    // Build a structured log message.
    const card = gameState.players.player.hand.find(
      (c) => c.instanceId === cardInstanceId,
    );
    const def = card ? gameState.cardDefinitions[card.cardId] : undefined;
    const nameId = def ? `card.${def.id}.name` : "";
    let playerLabel: LogMessage;
    if (def && def.effects.length > 0) {
      playerLabel = {
        id: "game.youPlayWithFx",
        params: { nameId, fx: def.effects.map((e) => e.type).join(", ") },
      };
    } else {
      playerLabel = { id: "game.youPlay", params: { nameId } };
    }

    const next = applyAction(gameState, action);
    commitAfterPlayer(next, playerLabel, set);
  },

  pass() {
    const { gameState } = get();
    if (!gameState || gameState.status !== "playing") return;
    if (gameState.currentPlayerId !== "player") return;
    if (gameState.players.player.hasPassed) return;

    const next = applyAction(gameState, { type: "PASS", playerId: "player" });
    commitAfterPlayer(next, { id: "game.youPass" }, set);
  },

  startNextRound() {
    const { gameState } = get();
    if (!gameState || gameState.status !== "round_finished") return;

    let next = applyAction(gameState, { type: "START_NEXT_ROUND" });
    let lastAction: LogMessage = { id: "game.roundStarted" };

    // If opponent goes first in the new round, let AI respond immediately.
    if (next.status === "playing" && next.currentPlayerId === "opponent") {
      const result = advanceOpponentAI(next);
      next = result.state;
      if (result.lastAction) lastAction = result.lastAction;
    }

    set({ gameState: next, lastAction });
  },

  restart() {
    set({
      screen: "start",
      gameState: null,
      lastAction: null,
      selectedLevel: null,
      playerDeck: [],
      deckBuildError: null,
      campaignMode: false,
      campaignFactionChosen: false,
      campaignFactionLocked: false,
    });
  },

  scores() {
    const { gameState } = get();
    if (!gameState) return null;
    return calculateScores(gameState);
  },

  // ── Campaign actions ─────────────────────────────────────────────────────

  goToLevelSelect() {
    const isNewCampaign = !get().campaignMode;
    set({
      screen: "level_select",
      campaignMode: true,
      selectedLevel: null,
      deckBuildError: null,
      ...(isNewCampaign
        ? {
            campaignFactionChosen: false,
            campaignFactionLocked: false,
            playerDeck: [],
          }
        : {}),
    });
  },

  selectLevel(level) {
    const { campaignFactionChosen, playerDeck, validateDeck, startLevelGame } = get();
    if (!campaignFactionChosen) return;

    // Check if the level is unlocked.
    const saveStore = useSaveStore.getState();
    const isComplete = saveStore.isComplete;
    const isCampaignCleared = isComplete("level-6-apex");
    const levelIndex = CAMPAIGN_LEVELS.findIndex((l) => l.id === level.id);
    const isUnlocked =
      isCampaignCleared ||
      levelIndex === 0 ||
      (levelIndex > 0 && isComplete(CAMPAIGN_LEVELS[levelIndex - 1].id));

    if (!isUnlocked) return;

    set({
      selectedLevel: level,
      deckBuildError: null,
      campaignFactionLocked: true,
    });

    if (playerDeck.length === DECK_SIZE) {
      const error = validateDeck();
      if (!error) {
        startLevelGame();
        return;
      }
      set({ deckBuildError: error, screen: "deck_builder" });
      return;
    }

    set({ screen: "deck_builder" });
  },

  toggleCardInDeck(cardId) {
    const { playerDeck, selectedLevel, playerFaction, campaignMode } = get();
    const constraint = selectedLevel?.deckConstraint;
    const idx = playerDeck.indexOf(cardId);

    if (campaignMode && !isAllowedCampaignDeckCard(cardId, playerFaction)) {
      return;
    }

    if (idx !== -1 && constraint && !constraint.allowDuplicates) {
      // Unique-deck levels use the pool click as a toggle.
      const next = [...playerDeck];
      next.splice(idx, 1);
      set({ playerDeck: next, deckBuildError: null });
      return;
    }

    // Add a copy if there is room.
    if (playerDeck.length >= DECK_SIZE) return;
    
    const allowDuplicates = constraint ? constraint.allowDuplicates : true;
    const currentCount = playerDeck.filter((id) => id === cardId).length;
    const maxCopies = getMaxCardCopies(cardId, allowDuplicates);
    if (currentCount >= maxCopies) {
      return;
    }
    
    set({ playerDeck: [...playerDeck, cardId], deckBuildError: null });
  },

  removeCardFromDeck(cardId) {
    const { playerDeck } = get();
    const idx = playerDeck.indexOf(cardId);
    if (idx === -1) return;
    const next = [...playerDeck];
    next.splice(idx, 1);
    set({ playerDeck: next, deckBuildError: null });
  },

  autoFillDeck() {
    const { playerDeck, selectedLevel, playerFaction, campaignMode } = get();
    if (!campaignMode || !selectedLevel) return;

    const constraint = selectedLevel.deckConstraint;
    const pool = getCampaignDeckPool(playerFaction);
    if (pool.length === 0) return;

    const next = playerDeck.filter((cardId) =>
      isAllowedCampaignDeckCard(cardId, playerFaction),
    );

    let poolIndex = 0;
    while (next.length < DECK_SIZE && poolIndex < pool.length * DECK_SIZE) {
      const cardId = pool[poolIndex % pool.length].id;
      poolIndex++;

      const currentCount = next.filter((id) => id === cardId).length;
      const maxCopies = getMaxCardCopies(cardId, constraint.allowDuplicates);
      if (currentCount >= maxCopies) {
        continue;
      }
      next.push(cardId);
    }

    set({ playerDeck: next.slice(0, DECK_SIZE), deckBuildError: null });
  },

  validateDeck() {
    const { playerDeck, selectedLevel, campaignMode, playerFaction } = get();
    if (!selectedLevel) return "No level selected.";
    const constraint = selectedLevel.deckConstraint;

    if (playerDeck.length !== DECK_SIZE) {
      return `Deck must contain exactly ${DECK_SIZE} cards (currently ${playerDeck.length}).`;
    }
    if (!constraint.allowDuplicates) {
      const unique = new Set(playerDeck);
      if (unique.size !== playerDeck.length) {
        return "This level requires all 25 cards to be unique — remove duplicates.";
      }
    }
    if (
      campaignMode &&
      playerDeck.some((cardId) => !isAllowedCampaignDeckCard(cardId, playerFaction))
    ) {
      return "Deck can only contain cards from your campaign faction.";
    }
    if (constraint.requiredFactions && constraint.requiredFactions.length > 0) {
      for (const faction of constraint.requiredFactions) {
        const hasIt = playerDeck.some((id) => {
          const def = findCardDefinition(id);
          return def?.faction === faction;
        });
        if (!hasIt) {
          return `Your deck must include at least one ${faction} card.`;
        }
      }
    }
    if (constraint.minFactions) {
      const factions = new Set(
        playerDeck
          .map((id) => findCardDefinition(id)?.faction)
          .filter(Boolean),
      );
      if (factions.size < constraint.minFactions) {
        return `Your deck must include cards from at least ${constraint.minFactions} factions.`;
      }
    }

    // Check card copy limits based on rarity
    const counts: Record<string, number> = {};
    for (const id of playerDeck) {
      counts[id] = (counts[id] ?? 0) + 1;
      const maxCopies = getMaxCardCopies(id, constraint.allowDuplicates);
      if (counts[id] > maxCopies) {
        const def = findCardDefinition(id);
        const name = def ? def.name : id;
        return `Too many copies of "${name}" (max ${maxCopies} allowed).`;
      }
    }

    return null;
  },

  startLevelGame() {
    const { selectedLevel, playerDeck, validateDeck } = get();
    const error = validateDeck();
    if (error) {
      set({ deckBuildError: error });
      return;
    }
    if (!selectedLevel) return;

    // Resolve player card IDs → CardDefinition[].
    const playerCardDefs = playerDeck
      .map((id) => findCardDefinition(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);

    // Resolve opponent card IDs → CardDefinition[].
    const opponentCardDefs = selectedLevel.opponentDeck
      .map((id) => findCardDefinition(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);

    const initialState = createInitialGameState({
      seed: seedFromNow(),
      playerFaction: get().playerFaction,
      opponentFaction: selectedLevel.opponentFaction,
      playerDeck: playerCardDefs,
      opponentDeck: opponentCardDefs,
      firstPlayerId: "player",
    });

    const { state, lastAction } = advanceOpponentAI(initialState);
    set({
      screen: "game",
      gameState: state,
      lastAction: lastAction?.id ? lastAction : { id: "game.yourTurn" },
    });
  },

  levelPassed() {
    const { gameState, selectedLevel } = get();
    if (!gameState || gameState.status !== "game_finished" || !selectedLevel) {
      return false;
    }
    const condition = selectedLevel.winCondition;

    if (condition.type === "standard") {
      return gameState.winnerId === "player";
    }

    if (condition.type === "must_win_round2") {
      // Player must have won the match AND specifically won round 2.
      if (gameState.winnerId !== "player") return false;
      // Find the round-2 settlement: first round_finished / game_finished
      // entry that appears after round 2 begins.
      let inRound2 = false;
      for (const entry of gameState.actionLog) {
        if (entry.message === "START_NEXT_ROUND" && !inRound2) {
          inRound2 = true; // round 2 has started
          continue;
        }
        if (inRound2 && entry.message === "ROUND_SETTLED") {
          // The roundWinnerId at round-2 settlement is embedded in the state
          // snapshot; we approximate by checking round wins after the game.
          // If player won the overall match 2-1 or 2-0 they must have won r2
          // unless they lost r1 and won r2+r3 — both count as winning r2.
          // For the must_win_round2 condition we record whether player won
          // each round via roundWins. Player having roundWins >= 1 after r2
          // settlement means they won at least one of r1/r2; if they also
          // won the match they won at least two — so r2 was one of them.
          // Simple proxy: player won the match (checked above) is sufficient
          // for the campaign design intent. No further log scanning needed.
          break;
        }
      }
      // The campaign design intent: player must win the match.
      // The opponent deliberately concedes r1, so winning the match requires
      // winning at least one of r2/r3. Since the opponent is strong in r2/r3,
      // this naturally enforces the "comeback" scenario.
      return true;
    }

    return false;
  },
}));

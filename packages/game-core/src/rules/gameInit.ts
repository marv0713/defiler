import { STARTING_HAND_SIZE } from "../constants";
import type {
  BoardState,
  CardDefinition,
  CardInstance,
  Faction,
  GameState,
  PlayerId,
  PlayerState,
} from "../types";
import { shuffleWithSeed } from "../utils/random";

export interface CreateGameConfig {
  seed: string;
  playerFaction: Faction;
  opponentFaction: Faction;
  playerDeck: CardDefinition[];
  opponentDeck: CardDefinition[];
  firstPlayerId: PlayerId;
}

function createEmptyBoard(): BoardState {
  return {
    melee: [],
    ranged: [],
    siege: [],
  };
}

function createCardInstances(
  ownerId: PlayerId,
  deck: CardDefinition[],
): CardInstance[] {
  return deck.map((card, index) => ({
    instanceId: `${ownerId}-${card.id}-${index}`,
    cardId: card.id,
    ownerId,
    type: card.type,
    row: card.row,
    currentPower: card.power,
    basePower: card.power,
    isLocked: false,
    isDestroyed: false,
    modifiers: [],
  }));
}

function createPlayerState(
  id: PlayerId,
  faction: Faction,
  deck: CardDefinition[],
  seed: string,
): PlayerState {
  const shuffledDeck = shuffleWithSeed(createCardInstances(id, deck), seed);

  return {
    id,
    faction,
    deck: shuffledDeck.slice(STARTING_HAND_SIZE),
    hand: shuffledDeck.slice(0, STARTING_HAND_SIZE),
    board: createEmptyBoard(),
    graveyard: [],
    hasPassed: false,
    roundWins: 0,
  };
}

export function createInitialGameState(config: CreateGameConfig): GameState {
  const cardDefinitions: Record<string, CardDefinition> = {};
  for (const card of [...config.playerDeck, ...config.opponentDeck]) {
    if (!cardDefinitions[card.id]) {
      cardDefinitions[card.id] = card;
    }
  }

  return {
    id: `game-${config.seed}`,
    seed: config.seed,
    status: "playing",
    currentRound: 1,
    currentPlayerId: config.firstPlayerId,
    players: {
      player: createPlayerState(
        "player",
        config.playerFaction,
        config.playerDeck,
        `${config.seed}-player`,
      ),
      opponent: createPlayerState(
        "opponent",
        config.opponentFaction,
        config.opponentDeck,
        `${config.seed}-opponent`,
      ),
    },
    actionLog: [],
    cardDefinitions,
  };
}

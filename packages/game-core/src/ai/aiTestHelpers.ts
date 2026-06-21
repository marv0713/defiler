import type {
  CardDefinition,
  CardInstance,
  Faction,
  GameState,
  PlayerId,
  PlayerState,
  Row,
} from "../types";

export function makeTestCard(
  instanceId: string,
  power: number,
  ownerId: PlayerId = "opponent",
  row: Row = "melee",
): CardInstance {
  return {
    instanceId,
    cardId: instanceId,
    ownerId,
    type: "unit",
    row,
    currentPower: power,
    basePower: power,
    isLocked: false,
    isDestroyed: false,
    modifiers: [],
  };
}

export function makeTestCardDefinition(
  card: CardInstance,
  faction: Faction = "neutral",
): CardDefinition {
  return {
    id: card.cardId,
    name: card.cardId,
    englishName: card.cardId,
    faction,
    type: card.type,
    row: card.row,
    power: card.basePower,
    rarity: "common",
    tags: [],
    effects: [],
    description: card.cardId,
  };
}

export function makeTestPlayer(
  id: PlayerId,
  hand: CardInstance[] = [],
  boardMelee: CardInstance[] = [],
  hasPassed = false,
  roundWins = 0,
): PlayerState {
  return {
    id,
    faction: id === "player" ? "qin" : "chu",
    deck: [],
    hand,
    board: { melee: boardMelee, ranged: [], siege: [] },
    graveyard: [],
    hasPassed,
    roundWins,
  };
}

export function makeTestState(
  player: PlayerState,
  opponent: PlayerState,
  round = 1,
  currentPlayerId: PlayerId = "opponent",
): GameState {
  const cardDefinitions: Record<string, CardDefinition> = {};
  for (const testPlayer of [player, opponent]) {
    for (const card of [
      ...testPlayer.hand,
      ...testPlayer.board.melee,
      ...testPlayer.board.ranged,
      ...testPlayer.board.siege,
      ...testPlayer.graveyard,
    ]) {
      cardDefinitions[card.cardId] = makeTestCardDefinition(
        card,
        testPlayer.faction,
      );
    }
  }

  return {
    id: "test",
    seed: "test-seed",
    status: "playing",
    currentRound: round,
    currentPlayerId,
    players: { player, opponent },
    actionLog: [],
    cardDefinitions,
  };
}

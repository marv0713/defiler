import type { CardDefinition, CardInstance } from "@warring-states/game-core";

const ROW_BADGE: Record<string, string> = {
  melee: "M",
  ranged: "R",
  siege: "S",
};

const ROW_COLOR: Record<string, string> = {
  melee: "#8b1a1a",
  ranged: "#1a6b40",
  siege: "#7a6010",
};

interface HandViewProps {
  cards: CardInstance[];
  cardDefinitions: Record<string, CardDefinition>;
  /** Whether the player is currently allowed to play cards. */
  canPlay: boolean;
  onPlay: (cardInstanceId: string) => void;
}

export function HandView({
  cards,
  cardDefinitions,
  canPlay,
  onPlay,
}: HandViewProps) {
  return (
    <div className="hand-view">
      <div className="hand-view__cards">
        {cards.map((card) => {
          const def = cardDefinitions[card.cardId];
          const displayName = def?.englishName ?? card.cardId.replace(/-/g, " ");
          return (
            <button
              key={card.instanceId}
              className={`hand-card${canPlay ? " hand-card--playable" : ""}`}
              onClick={() => canPlay && onPlay(card.instanceId)}
              title={
                def
                  ? `${def.englishName}${def.description ? `\n${def.description}` : ""}`
                  : displayName
              }
              aria-label={`Play ${displayName}, power ${card.currentPower}${card.row ? `, row: ${card.row}` : ""}`}
            >
              <span className="hand-card__power">{card.currentPower}</span>
              <span className="hand-card__name">{displayName}</span>
              {card.row && (
                <span
                  className="hand-card__row-badge"
                  style={{ background: ROW_COLOR[card.row] ?? "#444" }}
                >
                  {ROW_BADGE[card.row] ?? "?"}
                </span>
              )}
            </button>
          );
        })}
        {cards.length === 0 && (
          <span className="hand-view__empty">— no cards in hand —</span>
        )}
      </div>
    </div>
  );
}

import type { CardDefinition, CardInstance } from "@warring-states/game-core";
import { getCardName } from "../i18n/i18n";
import { useGameStore } from "../store/gameStore";

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
  t: (id: string, params?: Record<string, string | number>) => string;
  selectedCardId?: string | null;
}

export function HandView({
  cards,
  cardDefinitions,
  canPlay,
  onPlay,
  t,
  selectedCardId,
}: HandViewProps) {
  const setHoveredCard = useGameStore((s) => s.setHoveredCard);

  return (
    <div className="hand-view">
      <div className="hand-view__cards">
        {cards.map((card) => {
          const def = cardDefinitions[card.cardId];
          const displayName = getCardName(t, def, card.cardId);
          const rowText = card.row
            ? t("hand.rowText", { row: t(`row.${card.row}`) })
            : "";
          const isSelected = selectedCardId === card.instanceId;
          return (
            <button
              key={card.instanceId}
              className={`hand-card${canPlay ? " hand-card--playable" : ""}${isSelected ? " hand-card--selected" : ""}`}
              onClick={() => canPlay && onPlay(card.instanceId)}
              onMouseEnter={() => setHoveredCard(def)}
              onMouseLeave={() => setHoveredCard(null)}
              onFocus={() => setHoveredCard(def)}
              onBlur={() => setHoveredCard(null)}
              aria-label={t("hand.playCardLabel", {
                card: displayName,
                power: card.currentPower,
                rowText,
              })}
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
          <span className="hand-view__empty">{t("hand.empty")}</span>
        )}
      </div>
    </div>
  );
}

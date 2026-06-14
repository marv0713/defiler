import type { CardInstance } from "@warring-states/game-core";

interface CardViewProps {
  card: CardInstance;
  ghost?: boolean;
}

// Map faction color by ownerId prefix or cardId prefix
function getFactionColor(card: CardInstance): string {
  if (card.ownerId === "player") return "red";
  return "blue";
}

export function CardView({ card, ghost = false }: CardViewProps) {
  const factionColor = getFactionColor(card);
  const cls = [
    "card",
    `card--${factionColor}`,
    card.isDestroyed ? "card--destroyed" : "",
    card.isLocked ? "card--locked" : "",
    ghost ? "card--ghost" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Clean up the display name from the instanceId
  const rawName = card.cardId
    .replace(/^(qin|chu|qi|zhao|neutral)-/, "")
    .replace(/-token$/, " ★")
    .replace(/-/g, " ");

  return (
    <div className={cls} title={card.cardId}>
      <span className="card__power">{card.currentPower}</span>
      <span className="card__name">{rawName}</span>
    </div>
  );
}

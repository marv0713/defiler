import type { CardDefinition, CardInstance } from "@warring-states/game-core";
import { getCardName } from "../i18n/i18n";
import { useGameStore } from "../store/gameStore";

interface CardViewProps {
  card: CardInstance;
  definition?: CardDefinition;
  ghost?: boolean;
  t?: (id: string) => string;
}

function getFactionColor(card: CardInstance): string {
  return card.ownerId === "player" ? "red" : "blue";
}

/** Short label for each effect type shown on board cards. */
function getEffectBadge(def: CardDefinition | undefined): string | null {
  if (!def || def.effects.length === 0) return null;
  const types = def.effects.map((e) => e.type);
  // Show the most impactful effect type as a short badge.
  if (types.includes("DESTROY"))           return "💀";
  if (types.includes("DAMAGE"))            return "🗡";
  if (types.includes("BUFF"))              return "⬆";
  if (types.includes("DRAW_DISCARD"))      return "🃏";
  if (types.includes("SUMMON"))            return "✨";
  if (types.includes("REVIVE"))            return "♻";
  if (types.includes("LOCK"))              return "🔐";
  if (types.includes("CONDITIONAL_BOOST")) return "⚡";
  return "⚡";
}

export function CardView({ card, definition, ghost = false, t }: CardViewProps) {
  const factionColor = getFactionColor(card);
  const setHoveredCard = useGameStore((s) => s.setHoveredCard);
  const cls = [
    "card",
    `card--${factionColor}`,
    card.isDestroyed ? "card--destroyed" : "",
    card.isLocked ? "card--locked" : "",
    ghost ? "card--ghost" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const displayName =
    t ? getCardName(t, definition, card.cardId) :
      definition?.englishName ??
      card.cardId
        .replace(/^(qin|chu|qi|zhao|neutral)-/, "")
        .replace(/-token$/, " ★")
        .replace(/-/g, " ");

  const effectBadge = getEffectBadge(definition);

  return (
    <div
      className={cls}
      onMouseEnter={() => definition && setHoveredCard(definition)}
      onMouseLeave={() => setHoveredCard(null)}
      onFocus={() => definition && setHoveredCard(definition)}
      onBlur={() => setHoveredCard(null)}
      tabIndex={0}
    >
      <span className="card__power">{card.currentPower}</span>
      <span className="card__name">{displayName}</span>
      {effectBadge && (
        <span className="card__effect-badge" aria-label="has effect">
          {effectBadge}
        </span>
      )}
    </div>
  );
}

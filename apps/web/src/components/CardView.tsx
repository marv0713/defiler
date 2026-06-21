import type { CardDefinition, CardInstance } from "@warring-states/game-core";

interface CardViewProps {
  card: CardInstance;
  definition?: CardDefinition;
  ghost?: boolean;
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

export function CardView({ card, definition, ghost = false }: CardViewProps) {
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

  // Prefer the definition's English name; fall back to deriving from cardId.
  const displayName =
    definition?.englishName ??
    card.cardId
      .replace(/^(qin|chu|qi|zhao|neutral)-/, "")
      .replace(/-token$/, " ★")
      .replace(/-/g, " ");

  const effectBadge = getEffectBadge(definition);
  const tooltip = definition
    ? `${definition.englishName}${definition.description ? `\n${definition.description}` : ""}`
    : card.cardId;

  return (
    <div className={cls} title={tooltip}>
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

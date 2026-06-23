import { useMemo, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useI18n } from "../i18n/I18nProvider";
import { INITIAL_CARDS } from "@warring-states/game-core";
import type { Faction } from "@warring-states/game-core";
import { getCardName, getCardDescription } from "../i18n/i18n";

const FACTION_COLOR: Record<string, string> = {
  qin: "var(--qin)",
  chu: "var(--chu)",
  qi: "var(--qi)",
  zhao: "var(--zhao)",
  neutral: "var(--neutral, #888)",
};


const PLAYABLE_FACTIONS: Faction[] = ["qin", "chu", "qi", "zhao"];

// All non-token cards grouped by faction.
const ALL_CARDS = INITIAL_CARDS.filter(
  (c) =>
    (c.type === "unit" || c.type === "special") &&
    c.id !== "qin-token" &&
    c.id !== "chu-token",
);

interface TooltipCard {
  name: string;
  description: string;
  power: number;
  row?: string;
}

export function DeckBuilderScreen() {
  const { t } = useI18n();

  const selectedLevel   = useGameStore((s) => s.selectedLevel);
  const playerFaction   = useGameStore((s) => s.playerFaction);
  const setPlayerFaction = useGameStore((s) => s.setPlayerFaction);
  const playerDeck      = useGameStore((s) => s.playerDeck);
  const deckBuildError  = useGameStore((s) => s.deckBuildError);
  const toggleCardInDeck = useGameStore((s) => s.toggleCardInDeck);
  const validateDeck    = useGameStore((s) => s.validateDeck);
  const startLevelGame  = useGameStore((s) => s.startLevelGame);
  const goToLevelSelect = useGameStore((s) => s.goToLevelSelect);

  // Tooltip state — show card detail on hover.
  const [tooltip, setTooltip] = useState<TooltipCard | null>(null);

  const constraint = selectedLevel?.deckConstraint;
  const deckSize = 25;

  // Cards in pool: only the selected faction (+ neutral if any exist).
  const poolCards = useMemo(
    () =>
      ALL_CARDS.filter(
        (c) => c.faction === playerFaction || c.faction === "neutral",
      ),
    [playerFaction],
  );

  // Count of each card ID in the current deck.
  const deckCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const id of playerDeck) map[id] = (map[id] ?? 0) + 1;
    return map;
  }, [playerDeck]);

  const validationError = validateDeck();
  const canStart = validationError === null;

  // Deck list entries with definitions.
  const deckEntries = useMemo(() => {
    const seen: Record<string, number> = {};
    return playerDeck
      .map((id) => {
        seen[id] = (seen[id] ?? 0) + 1;
        const def = INITIAL_CARDS.find((c) => c.id === id);
        return def ? { def, key: `${id}-${seen[id]}` } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [playerDeck]);

  if (!selectedLevel) return null;

  return (
    <div className="deck-builder-screen">
      {/* Header */}
      <header className="deck-builder-header">
        <button className="btn-back" onClick={goToLevelSelect}>
          ← {t("deckbuilder.backToLevels")}
        </button>
        <div className="deck-builder-level-info">
          <span className="deck-builder-level-name">{selectedLevel.title}</span>
          <span className="deck-builder-hint">💡 {t(selectedLevel.hintTextId)}</span>
        </div>
        <div className="deck-counter">
          {playerDeck.length} / {deckSize}
        </div>
      </header>

      <div className="deck-builder-body">
        {/* Left: Card Pool */}
        <div className="card-pool">
          {/* Faction selector */}
          <div className="pool-faction-selector">
            <span className="pool-faction-selector__label">
              {t("deckbuilder.chooseFaction")}
            </span>
            <div className="pool-faction-selector__buttons">
              {PLAYABLE_FACTIONS.map((f) => (
                <button
                  key={f}
                  className={`pool-faction-btn${playerFaction === f ? " pool-faction-btn--active" : ""}`}
                  style={
                    playerFaction === f
                      ? { borderColor: FACTION_COLOR[f], color: FACTION_COLOR[f] }
                      : {}
                  }
                  onClick={() => setPlayerFaction(f)}
                >
                  {t(`faction.${f}.name`)}
                </button>
              ))}
            </div>
          </div>

          <h2 className="pool-heading">{t("deckbuilder.cardPool")}</h2>

          <div className="pool-card-list">
            {poolCards.map((card) => {
              const count = deckCount[card.id] ?? 0;
              const inDeck = count > 0;
              const atMax =
                playerDeck.length >= deckSize ||
                (!constraint?.allowDuplicates && inDeck);
              const cardName = getCardName(t, card, card.id);
              const cardDesc = getCardDescription(t, card);
              return (
                <button
                  key={card.id}
                  id={`pool-card-${card.id}`}
                  className={`pool-card ${inDeck ? "pool-card--selected" : ""} ${atMax && !inDeck ? "pool-card--disabled" : ""}`}
                  onClick={() => toggleCardInDeck(card.id)}
                  onMouseEnter={() =>
                    setTooltip({
                      name: cardName,
                      description: cardDesc,
                      power: card.power,
                      row: card.row,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={() =>
                    setTooltip({
                      name: cardName,
                      description: cardDesc,
                      power: card.power,
                      row: card.row,
                    })
                  }
                  onBlur={() => setTooltip(null)}
                  aria-label={`${cardName}${cardDesc ? ` — ${cardDesc}` : ""}`}
                >
                  <span className="pool-card-power">{card.power}</span>
                  <span className="pool-card-name">{cardName}</span>
                  {card.row && (
                    <span className="pool-card-row">
                      {t(`row.${card.row}`).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {count > 0 && (
                    <span className="pool-card-count">×{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hover tooltip panel */}
          {tooltip && (
            <div className="pool-card-tooltip">
              <div className="pool-card-tooltip__header">
                <span className="pool-card-tooltip__name">{tooltip.name}</span>
                {tooltip.power > 0 && (
                  <span className="pool-card-tooltip__power">
                    {tooltip.power} {t("deckbuilder.tooltipPower")}
                  </span>
                )}
              </div>
              {tooltip.description && (
                <p className="pool-card-tooltip__desc">{tooltip.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Deck List */}
        <aside className="deck-list-panel">
          <h2 className="deck-list-heading">
            {t("deckbuilder.yourDeck")}{" "}
            <span className={playerDeck.length === deckSize ? "deck-count--full" : ""}>
              ({playerDeck.length}/{deckSize})
            </span>
          </h2>

          {/* Constraints summary */}
          <div className="constraint-summary">
            {!constraint?.allowDuplicates && (
              <div className="constraint-tag">
                ⚠ {t("deckbuilder.noDuplicates")}
              </div>
            )}
            {constraint?.requiredFactions?.map((f) => (
              <div key={f} className="constraint-tag">
                {t("deckbuilder.needsFaction", { faction: t(`faction.${f}.name`) })}
              </div>
            ))}
            {constraint?.minFactions && (
              <div className="constraint-tag">
                {t("deckbuilder.minFactions", { count: constraint.minFactions })}
              </div>
            )}
            {selectedLevel.winCondition.type === "must_win_round2" && (
              <div className="constraint-tag constraint-tag--special">
                {t("deckbuilder.mustWinRound2")}
              </div>
            )}
          </div>

          <ul className="deck-list">
            {deckEntries.map(({ def, key }) => (
              <li key={key} className="deck-list-item">
                <span className="deck-item-power">{def.power}</span>
                <span className="deck-item-name">{getCardName(t, def, def.id)}</span>
                <button
                  className="deck-item-remove"
                  onClick={() => toggleCardInDeck(def.id)}
                  title={t("deckbuilder.removeCard")}
                >
                  ✕
                </button>
              </li>
            ))}
            {playerDeck.length === 0 && (
              <li className="deck-list-empty">{t("deckbuilder.emptyHint")}</li>
            )}
          </ul>

          {/* Error + Start */}
          <div className="deck-builder-footer">
            {(deckBuildError ?? validationError) && (
              <div className="deck-error">
                {deckBuildError ?? validationError}
              </div>
            )}
            <button
              id="start-battle-btn"
              className={`btn-start-battle ${canStart ? "" : "btn-start-battle--disabled"}`}
              onClick={startLevelGame}
            >
              {canStart
                ? `⚔ ${t("deckbuilder.startBattle")}`
                : `${playerDeck.length}/${deckSize} ${t("deckbuilder.cards")}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

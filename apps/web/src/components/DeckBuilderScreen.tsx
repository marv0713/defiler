import { useMemo, useState } from "react";
import { useGameStore, getMaxCardCopies } from "../store/gameStore";
import { useI18n } from "../i18n/I18nProvider";
import { INITIAL_CARDS, type CardDefinition } from "@warring-states/game-core";
import { getCardName, getCardDescription } from "../i18n/i18n";

const FACTION_COLOR: Record<string, string> = {
  qin: "var(--qin)",
  chu: "var(--chu)",
  qi: "var(--qi)",
  zhao: "var(--zhao)",
  neutral: "var(--neutral, #888)",
};

// All non-token cards grouped by faction.
const ALL_CARDS = INITIAL_CARDS.filter(
  (c) =>
    (c.type === "unit" || c.type === "special") &&
    c.id !== "qin-token" &&
    c.id !== "chu-token",
);

export function DeckBuilderScreen() {
  const { t } = useI18n();

  const selectedLevel   = useGameStore((s) => s.selectedLevel);
  const playerFaction   = useGameStore((s) => s.playerFaction);
  const playerDeck      = useGameStore((s) => s.playerDeck);
  const deckBuildError  = useGameStore((s) => s.deckBuildError);
  const toggleCardInDeck = useGameStore((s) => s.toggleCardInDeck);
  const removeCardFromDeck = useGameStore((s) => s.removeCardFromDeck);
  const autoFillDeck = useGameStore((s) => s.autoFillDeck);
  const validateDeck    = useGameStore((s) => s.validateDeck);
  const startLevelGame  = useGameStore((s) => s.startLevelGame);
  const goToLevelSelect = useGameStore((s) => s.goToLevelSelect);

  // Preview state — show card detail in right panel.
  const [previewCard, setPreviewCard] = useState<CardDefinition | null>(null);

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
          <div className="pool-faction-lock">
            <span className="pool-faction-selector__label">
              {t("deckbuilder.lockedFaction")}
            </span>
            <span
              className="pool-faction-badge"
              style={{ borderColor: FACTION_COLOR[playerFaction], color: FACTION_COLOR[playerFaction] }}
            >
              {t(`faction.${playerFaction}.name`)}
            </span>
            <span className="pool-faction-lock__hint">
              {t("deckbuilder.lockedFactionHint")}
            </span>
          </div>

          <h2 className="pool-heading">{t("deckbuilder.cardPool")}</h2>

          <div className="pool-card-list">
            {poolCards.map((card) => {
              const count = deckCount[card.id] ?? 0;
              const inDeck = count > 0;
              const allowDuplicates = constraint?.allowDuplicates ?? true;
              const maxCopies = getMaxCardCopies(card.id, allowDuplicates);
              const isDeckFull = playerDeck.length >= deckSize;
              const atLimit = count >= maxCopies;

              const atMax = allowDuplicates
                ? (isDeckFull || atLimit)
                : (inDeck ? false : isDeckFull);

              const cardName = getCardName(t, card, card.id);
              const cardDesc = getCardDescription(t, card);
              return (
                <button
                  key={card.id}
                  id={`pool-card-${card.id}`}
                  className={`pool-card ${inDeck ? "pool-card--selected" : ""} ${atMax ? "pool-card--disabled" : ""}`}
                  onClick={() => toggleCardInDeck(card.id)}
                  disabled={atMax}
                  onMouseEnter={() => setPreviewCard(card)}
                  onMouseLeave={() => setPreviewCard(null)}
                  onFocus={() => setPreviewCard(card)}
                  onBlur={() => setPreviewCard(null)}
                  aria-label={`${cardName}${cardDesc ? ` — ${cardDesc}` : ""}`}
                >
                  <span className="pool-card-power">{card.power}</span>
                  <span className="pool-card-name">{cardName}</span>
                  {card.row && (
                    <span className="pool-card-row">
                      {t(`row.${card.row}`).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className={`pool-card-count ${count === 0 ? "pool-card-count--zero" : ""}`}>
                    {count}/{maxCopies}
                  </span>
                </button>
              );
            })}
          </div>
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
              <li
                key={key}
                className="deck-list-item"
                onMouseEnter={() => setPreviewCard(def)}
                onMouseLeave={() => setPreviewCard(null)}
                onFocus={() => setPreviewCard(def)}
                onBlur={() => setPreviewCard(null)}
              >
                <span className="deck-item-power">{def.power}</span>
                <span className="deck-item-name">{getCardName(t, def, def.id)}</span>
                <button
                  className="deck-item-remove"
                  onClick={() => removeCardFromDeck(def.id)}
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
              className="btn-auto-fill"
              onClick={autoFillDeck}
              disabled={playerDeck.length >= deckSize}
            >
              {t("deckbuilder.autoFill")}
            </button>
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

        {/* Right: Card Preview */}
        <aside className="card-preview-panel">
          <h2 className="preview-heading">{t("deckbuilder.cardPreview")}</h2>
          {previewCard ? (
            <div className="card-preview-content">
              <div className={`card-preview-frame card-preview-frame--${previewCard.rarity} card-preview-frame--${previewCard.faction}`}>
                {/* Header */}
                <div className="preview-frame-header">
                  <span className="preview-frame-power">{previewCard.power}</span>
                  <span className="preview-frame-name">{getCardName(t, previewCard, previewCard.id)}</span>
                </div>

                {/* Art Placeholder */}
                <div className="preview-frame-art">
                  <div className="preview-frame-art-inner">
                    <span className="preview-art-icon">
                      {previewCard.type === "special" ? "📜" : (previewCard.row === "melee" ? "⚔" : previewCard.row === "ranged" ? "🏹" : "☄")}
                    </span>
                    <span className="preview-art-text">{t("deckbuilder.artPlaceholder")}</span>
                  </div>
                </div>

                {/* Metadata badges */}
                <div className="preview-frame-metadata">
                  <span className={`preview-badge badge-faction badge-faction--${previewCard.faction}`}>
                    {t(`faction.${previewCard.faction}.name`)}
                  </span>
                  {previewCard.row && (
                    <span className="preview-badge badge-row">
                      {t(`row.${previewCard.row}`)}
                    </span>
                  )}
                  <span className={`preview-badge badge-rarity badge-rarity--${previewCard.rarity}`}>
                    {t(`rarity.${previewCard.rarity}`)}
                  </span>
                  <span className="preview-badge badge-type">
                    {t(`cardtype.${previewCard.type}`)}
                  </span>
                </div>

                {/* Description Body */}
                <div className="preview-frame-body">
                  <p className="preview-frame-desc">
                    {getCardDescription(t, previewCard)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-preview-placeholder">
              <div className="preview-placeholder-icon">🃏</div>
              <p>{t("deckbuilder.previewPlaceholder")}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

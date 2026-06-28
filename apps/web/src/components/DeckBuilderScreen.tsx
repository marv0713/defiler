import { useMemo, useState } from "react";
import { useGameStore, getMaxCardCopies } from "../store/gameStore";
import { useI18n } from "../i18n/I18nProvider";
import { INITIAL_CARDS, getCampaignCardPool, type CardDefinition } from "@warring-states/game-core";
import { getCardName, getCardDescription } from "../i18n/i18n";

const FACTION_COLOR: Record<string, string> = {
  qin: "var(--qin)",
  chu: "var(--chu)",
  qi: "var(--qi)",
  zhao: "var(--zhao)",
  neutral: "var(--neutral, #888)",
};

type FilterId = "all" | "unit" | "special" | "addable";
type SortId = "default" | "power";

const FILTERS: { id: FilterId; key: string }[] = [
  { id: "all", key: "deckbuilder.filterAll" },
  { id: "unit", key: "deckbuilder.filterUnits" },
  { id: "special", key: "deckbuilder.filterSpecials" },
  { id: "addable", key: "deckbuilder.filterAddable" },
];

export function DeckBuilderScreen() {
  const { t } = useI18n();

  const selectedLevel = useGameStore((s) => s.selectedLevel);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const playerDeck = useGameStore((s) => s.playerDeck);
  const deckBuildError = useGameStore((s) => s.deckBuildError);
  const toggleCardInDeck = useGameStore((s) => s.toggleCardInDeck);
  const removeCardFromDeck = useGameStore((s) => s.removeCardFromDeck);
  const autoFillDeck = useGameStore((s) => s.autoFillDeck);
  const validateDeck = useGameStore((s) => s.validateDeck);
  const startLevelGame = useGameStore((s) => s.startLevelGame);
  const goToLevelSelect = useGameStore((s) => s.goToLevelSelect);

  const [previewCard, setPreviewCard] = useState<CardDefinition | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [sortBy, setSortBy] = useState<SortId>("default");

  const constraint = selectedLevel?.deckConstraint;
  const deckSize = 25;

  // Full campaign pool for the faction.
  const poolCards = useMemo(
    () => getCampaignCardPool(playerFaction),
    [playerFaction],
  );

  // Deck count map.
  const deckCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const id of playerDeck) map[id] = (map[id] ?? 0) + 1;
    return map;
  }, [playerDeck]);

  // Filtered + sorted pool.
  const filteredPool = useMemo(() => {
    let cards = [...poolCards];
    const allowDuplicates = constraint?.allowDuplicates ?? true;

    if (filter === "unit") cards = cards.filter((c) => c.type === "unit");
    else if (filter === "special") cards = cards.filter((c) => c.type === "special");
    else if (filter === "addable") {
      cards = cards.filter((c) => {
        const count = deckCount[c.id] ?? 0;
        const maxCopies = getMaxCardCopies(c.id, allowDuplicates);
        return count < maxCopies && playerDeck.length < deckSize;
      });
    }

    if (sortBy === "power") {
      cards.sort((a, b) => b.power - a.power);
    }

    return cards;
  }, [poolCards, filter, sortBy, deckCount, playerDeck.length, constraint]);

  // Deck structure stats.
  const deckStats = useMemo(() => {
    const defs = playerDeck
      .map((id) => INITIAL_CARDS.find((c) => c.id === id))
      .filter(Boolean) as CardDefinition[];
    const units = defs.filter((c) => c.type === "unit");
    const specials = defs.filter((c) => c.type === "special");
    const neutrals = defs.filter((c) => c.faction === "neutral");
    const unitPowers = units.map((c) => c.power);
    const avgPower =
      unitPowers.length > 0
        ? Math.round((unitPowers.reduce((s, p) => s + p, 0) / unitPowers.length) * 10) / 10
        : 0;

    return {
      units: units.length,
      specials: specials.length,
      neutral: neutrals.length,
      melee: units.filter((c) => c.row === "melee").length,
      ranged: units.filter((c) => c.row === "ranged").length,
      siege: units.filter((c) => c.row === "siege").length,
      avgPower,
    };
  }, [playerDeck]);

  const validationError = validateDeck();
  const canStart = validationError === null;
  const isFull = playerDeck.length >= deckSize;

  // Deck list entries.
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

  const handleClearDeck = () => {
    const currentDeck = [...playerDeck];
    for (const id of currentDeck) {
      removeCardFromDeck(id);
    }
  };

  if (!selectedLevel) return null;

  return (
    <div className="deck-builder-screen">
      {/* ── Header ── */}
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

      {/* ── Stage Goal Card ── */}
      <div className="deck-stage-goal">
        <div className="stage-goal-row">
          <strong>{t("deckbuilder.stageGoal")}:</strong>{" "}
          {selectedLevel.title}
        </div>
        <div className="stage-goal-row">
          <strong>{t("deckbuilder.specialRule")}:</strong>{" "}
          {selectedLevel.winCondition.type === "must_win_round2"
            ? t("deckbuilder.mustWinRound2")
            : t("levelselect.vs") + " " + t(`faction.${selectedLevel.opponentFaction}.name`)}
        </div>
        <div className="stage-goal-row">
          <strong>{t("campaign.enemyMechanic")}:</strong>{" "}
          {t(`level.${selectedLevel.id}.mechanic`)}
        </div>
      </div>

      <div className="deck-builder-body">
        {/* ── Left: Card Pool ── */}
        <div className="card-pool">
          {/* Locked faction badge */}
          <div className="pool-faction-lock">
            <span
              className="pool-faction-badge"
              style={{ borderColor: FACTION_COLOR[playerFaction], color: FACTION_COLOR[playerFaction] }}
            >
              {t(`faction.${playerFaction}.name`)}
            </span>
            <span className="pool-faction-lock__hint">
              {t("deckbuilder.lockedFactionHint")}
            </span>
            <span className="pool-faction-lock__hint pool-faction-lock__hint--dim">
              {t("deckbuilder.operationHint")}
            </span>
          </div>

          {/* Filter + Sort bar */}
          <div className="pool-filter-bar">
            <div className="pool-filters">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  className={`filter-pill${filter === f.id ? " filter-pill--active" : ""}`}
                  onClick={() => setFilter(f.id)}
                >
                  {t(f.key)}
                </button>
              ))}
            </div>
            <div className="pool-sort">
              <button
                className={`filter-pill${sortBy === "default" ? " filter-pill--active" : ""}`}
                onClick={() => setSortBy("default")}
              >
                {t("deckbuilder.sortDefault")}
              </button>
              <button
                className={`filter-pill${sortBy === "power" ? " filter-pill--active" : ""}`}
                onClick={() => setSortBy("power")}
              >
                {t("deckbuilder.sortPower")}
              </button>
            </div>
          </div>

          {/* Card list */}
          <div className="pool-card-list">
            {filteredPool.map((card) => {
              const count = deckCount[card.id] ?? 0;
              const inDeck = count > 0;
              const allowDuplicates = constraint?.allowDuplicates ?? true;
              const maxCopies = getMaxCardCopies(card.id, allowDuplicates);
              const atLimit = count >= maxCopies;
              const atMax = allowDuplicates
                ? isFull || atLimit
                : inDeck ? false : isFull;

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
            {filteredPool.length === 0 && (
              <div className="pool-card-list-empty">
                {t("deckbuilder.emptyHint")}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Deck List ── */}
        <aside className="deck-list-panel">
          <h2 className="deck-list-heading">
            {t("deckbuilder.yourDeck")}{" "}
            <span className={isFull ? "deck-count--full" : ""}>
              ({playerDeck.length}/{deckSize})
            </span>
          </h2>

          {/* Deck structure stats */}
          {playerDeck.length > 0 && (
            <div className="deck-stats">
              <div className="deck-stats__row">
                <span>{t("deckbuilder.statsUnits")} {deckStats.units}</span>
                <span>{t("deckbuilder.statsSpecials")} {deckStats.specials}</span>
                {deckStats.neutral > 0 && (
                  <span>{t("deckbuilder.statsMelee")} {deckStats.neutral}</span>
                )}
              </div>
              <div className="deck-stats__row">
                <span>{t("deckbuilder.statsMelee")} {deckStats.melee}</span>
                <span>{t("deckbuilder.statsRanged")} {deckStats.ranged}</span>
                <span>{t("deckbuilder.statsSiege")} {deckStats.siege}</span>
              </div>
              <div className="deck-stats__row">
                <span>{t("deckbuilder.avgPower")} {deckStats.avgPower}</span>
              </div>
            </div>
          )}

          {/* Constraints summary */}
          <div className="constraint-summary">
            {!constraint?.allowDuplicates && (
              <div className="constraint-tag">
                ⚠ {t("deckbuilder.noDuplicates")}
              </div>
            )}
            {selectedLevel.winCondition.type === "must_win_round2" && (
              <div className="constraint-tag constraint-tag--special">
                {t("deckbuilder.mustWinRound2")}
              </div>
            )}
          </div>

          {/* Deck card list */}
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

          {/* Error + Action buttons */}
          <div className="deck-builder-footer">
            {(deckBuildError || validationError) && (
              <div className="deck-error">
                {deckBuildError
                  ? t(deckBuildError)
                  : validationError
                    ? t(validationError.key, validationError.params as Record<string, string | number>)
                    : ""}
              </div>
            )}
            <button
              className="btn-auto-fill"
              onClick={autoFillDeck}
              disabled={isFull}
            >
              {t("deckbuilder.autoFill")}
            </button>
            <button
              className="btn-auto-fill"
              onClick={handleClearDeck}
              disabled={playerDeck.length === 0}
              style={{ marginTop: "4px" }}
            >
              {t("deckbuilder.clearDeck")}
            </button>
            <button
              id="start-battle-btn"
              className={`btn-start-battle ${canStart ? "" : "btn-start-battle--disabled"}`}
              onClick={startLevelGame}
              disabled={!canStart}
            >
              {canStart
                ? `⚔ ${t("deckbuilder.startBattle")}`
                : isFull
                  ? t("deckbuilder.deckIllegal")
                  : t("deckbuilder.needMoreCards", { count: deckSize - playerDeck.length })}
            </button>
          </div>
        </aside>

        {/* ── Right: Card Preview ── */}
        <aside className="card-preview-panel">
          <h2 className="preview-heading">{t("deckbuilder.cardPreview")}</h2>
          {previewCard ? (
            <div className="card-preview-content">
              <div className={`card-preview-frame card-preview-frame--${previewCard.rarity} card-preview-frame--${previewCard.faction}`}>
                <div className="preview-frame-header">
                  <span className="preview-frame-power">{previewCard.power}</span>
                  <span className="preview-frame-name">{getCardName(t, previewCard, previewCard.id)}</span>
                </div>
                <div className="preview-frame-art">
                  <div className="preview-frame-art-inner">
                    <span className="preview-art-icon">
                      {previewCard.type === "special" ? "📜" : previewCard.row === "melee" ? "⚔" : previewCard.row === "ranged" ? "🏹" : "☄"}
                    </span>
                    <span className="preview-art-text">{t("deckbuilder.artPlaceholder")}</span>
                  </div>
                </div>
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

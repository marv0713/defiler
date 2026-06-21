import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { INITIAL_CARDS } from "@warring-states/game-core";

const FACTION_COLOR: Record<string, string> = {
  qin: "var(--qin)",
  chu: "var(--chu)",
  qi: "var(--qi)",
  zhao: "var(--zhao)",
  neutral: "var(--neutral)",
};

const FACTION_LABEL: Record<string, string> = {
  qin: "秦 Qin",
  chu: "楚 Chu",
  qi: "齐 Qi",
  zhao: "赵 Zhao",
  neutral: "Neutral",
};

const ROW_BADGE: Record<string, string> = {
  melee: "M",
  ranged: "R",
  siege: "S",
};

// Group all 60 cards by faction.
const CARDS_BY_FACTION = (() => {
  const groups: Record<string, typeof INITIAL_CARDS> = {};
  for (const card of INITIAL_CARDS) {
    if (card.type === "unit" || card.type === "special") {
      (groups[card.faction] ??= []).push(card);
    }
  }
  return groups;
})();

const FACTION_ORDER = ["qin", "chu", "qi", "zhao", "neutral"];

export function DeckBuilderScreen() {
  const selectedLevel = useGameStore((s) => s.selectedLevel);
  const playerDeck = useGameStore((s) => s.playerDeck);
  const deckBuildError = useGameStore((s) => s.deckBuildError);
  const toggleCardInDeck = useGameStore((s) => s.toggleCardInDeck);
  const validateDeck = useGameStore((s) => s.validateDeck);
  const startLevelGame = useGameStore((s) => s.startLevelGame);
  const goToLevelSelect = useGameStore((s) => s.goToLevelSelect);

  const constraint = selectedLevel?.deckConstraint;
  const deckSize = 25;

  // Count of each card ID in the current deck.
  const deckCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const id of playerDeck) map[id] = (map[id] ?? 0) + 1;
    return map;
  }, [playerDeck]);

  const validationError = validateDeck();
  const canStart = validationError === null;

  // Cards in the deck with their definition (for the deck list panel).
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
          ← Levels
        </button>
        <div className="deck-builder-level-info">
          <span className="deck-builder-level-name">{selectedLevel.title}</span>
          <span className="deck-builder-hint">💡 {selectedLevel.hint}</span>
        </div>
        <div className="deck-counter">
          {playerDeck.length} / {deckSize}
        </div>
      </header>

      <div className="deck-builder-body">
        {/* Left: Card Pool */}
        <div className="card-pool">
          <h2 className="pool-heading">Card Pool</h2>
          {FACTION_ORDER.map((faction) => {
            const cards = CARDS_BY_FACTION[faction];
            if (!cards || cards.length === 0) return null;
            return (
              <section key={faction} className="pool-faction-section">
                <h3
                  className="pool-faction-label"
                  style={{ color: FACTION_COLOR[faction] }}
                >
                  {FACTION_LABEL[faction]}
                </h3>
                <div className="pool-card-list">
                  {cards
                    .filter((c) => c.id !== "qin-token" && c.id !== "chu-token")
                    .map((card) => {
                      const count = deckCount[card.id] ?? 0;
                      const inDeck = count > 0;
                      const atMax =
                        playerDeck.length >= deckSize ||
                        (!constraint?.allowDuplicates && inDeck);
                      return (
                        <button
                          key={card.id}
                          id={`pool-card-${card.id}`}
                          className={`pool-card ${inDeck ? "pool-card--selected" : ""} ${atMax && !inDeck ? "pool-card--disabled" : ""}`}
                          onClick={() => toggleCardInDeck(card.id)}
                          title={card.description ?? card.englishName}
                        >
                          <span className="pool-card-power">{card.power}</span>
                          <span className="pool-card-name">{card.englishName}</span>
                          {card.row && (
                            <span className="pool-card-row">{ROW_BADGE[card.row]}</span>
                          )}
                          {count > 0 && (
                            <span className="pool-card-count">×{count}</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Right: Deck List */}
        <aside className="deck-list-panel">
          <h2 className="deck-list-heading">
            Your Deck{" "}
            <span className={playerDeck.length === deckSize ? "deck-count--full" : ""}>
              ({playerDeck.length}/{deckSize})
            </span>
          </h2>

          {/* Constraints summary */}
          <div className="constraint-summary">
            {!constraint?.allowDuplicates && (
              <div className="constraint-tag">⚠ No duplicates</div>
            )}
            {constraint?.requiredFactions?.map((f) => (
              <div key={f} className="constraint-tag">
                Needs ≥1 {FACTION_LABEL[f]}
              </div>
            ))}
            {constraint?.minFactions && (
              <div className="constraint-tag">
                ≥{constraint.minFactions} factions
              </div>
            )}
            {selectedLevel.winCondition.type === "must_win_round2" && (
              <div className="constraint-tag constraint-tag--special">
                Must win Round 2
              </div>
            )}
          </div>

          <ul className="deck-list">
            {deckEntries.map(({ def, key }) => (
              <li key={key} className="deck-list-item">
                <span className="deck-item-power">{def.power}</span>
                <span className="deck-item-name">{def.englishName}</span>
                <button
                  className="deck-item-remove"
                  onClick={() => toggleCardInDeck(def.id)}
                  title="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
            {playerDeck.length === 0 && (
              <li className="deck-list-empty">Click cards to add them.</li>
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
              {canStart ? "⚔ Start Battle" : `${playerDeck.length}/${deckSize} cards`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

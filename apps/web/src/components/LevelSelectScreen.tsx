import { useSaveStore } from "../store/saveStore";
import { useGameStore, CAMPAIGN_LEVELS } from "../store/gameStore";

const DIFFICULTY_STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

const FACTION_LABEL: Record<string, string> = {
  qin: "Qin",
  chu: "Chu",
  qi: "Qi",
  zhao: "Zhao",
};

export function LevelSelectScreen() {
  const selectLevel = useGameStore((s) => s.selectLevel);
  const restart = useGameStore((s) => s.restart);
  const isComplete = useSaveStore((s) => s.isComplete);

  return (
    <div className="level-select-screen">
      <header className="level-select-header">
        <button className="btn-back" onClick={restart}>
          ← Back
        </button>
        <h1 className="level-select-title">Campaign</h1>
        <p className="level-select-subtitle">
          Build a 25-card deck and conquer all six challenges.
        </p>
      </header>

      <div className="level-grid">
        {CAMPAIGN_LEVELS.map((level, i) => {
          const done = isComplete(level.id);
          return (
            <button
              key={level.id}
              id={`level-card-${i + 1}`}
              className={`level-card ${done ? "level-card--done" : ""}`}
              onClick={() => selectLevel(level)}
            >
              <div className="level-card-number">
                {done ? "✓" : i + 1}
              </div>
              <div className="level-card-body">
                <div className="level-card-title">{level.title}</div>
                <div className="level-card-subtitle">{level.subtitle}</div>
                <div className="level-card-meta">
                  <span className="level-difficulty">
                    {DIFFICULTY_STARS(level.difficulty)}
                  </span>
                  <span className="level-opponent">
                    vs {FACTION_LABEL[level.opponentFaction] ?? level.opponentFaction}
                  </span>
                </div>
                {level.deckConstraint.allowDuplicates === false && (
                  <div className="level-constraint-badge">No duplicates</div>
                )}
                {level.deckConstraint.requiredFactions && (
                  <div className="level-constraint-badge">
                    Requires {level.deckConstraint.requiredFactions.map(f => FACTION_LABEL[f]).join(", ")} cards
                  </div>
                )}
                {level.deckConstraint.minFactions && (
                  <div className="level-constraint-badge">
                    ≥{level.deckConstraint.minFactions} factions
                  </div>
                )}
                {level.winCondition.type === "must_win_round2" && (
                  <div className="level-constraint-badge level-constraint-badge--special">
                    Must win Round 2
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

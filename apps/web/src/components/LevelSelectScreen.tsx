import { useSaveStore } from "../store/saveStore";
import { useGameStore, CAMPAIGN_LEVELS } from "../store/gameStore";
import { useI18n } from "../i18n/I18nProvider";

const DIFFICULTY_STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function LevelSelectScreen() {
  const selectLevel = useGameStore((s) => s.selectLevel);
  const restart     = useGameStore((s) => s.restart);
  const isComplete  = useSaveStore((s) => s.isComplete);
  const { t }       = useI18n();

  return (
    <div className="level-select-screen">
      <header className="level-select-header">
        <button className="btn-back" onClick={restart}>
          ← {t("levelselect.back")}
        </button>
        <h1 className="level-select-title">{t("levelselect.title")}</h1>
        <p className="level-select-subtitle">{t("levelselect.subtitle")}</p>
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
              <div className="level-card-number">{done ? "✓" : i + 1}</div>
              <div className="level-card-body">
                <div className="level-card-title">{level.title}</div>
                <div className="level-card-subtitle">{t(level.subtitleTextId)}</div>
                <div className="level-card-meta">
                  <span className="level-difficulty">
                    {DIFFICULTY_STARS(level.difficulty)}
                  </span>
                  <span className="level-opponent">
                    {t("levelselect.vs")} {t(`faction.${level.opponentFaction}.name`)}
                  </span>
                </div>
                {level.deckConstraint.allowDuplicates === false && (
                  <div className="level-constraint-badge">
                    {t("deckbuilder.noDuplicates")}
                  </div>
                )}
                {level.deckConstraint.requiredFactions && (
                  <div className="level-constraint-badge">
                    {t("deckbuilder.needsFaction", {
                      faction: level.deckConstraint.requiredFactions
                        .map((f) => t(`faction.${f}.name`))
                        .join(", "),
                    })}
                  </div>
                )}
                {level.deckConstraint.minFactions && (
                  <div className="level-constraint-badge">
                    {t("deckbuilder.minFactions", { count: level.deckConstraint.minFactions })}
                  </div>
                )}
                {level.winCondition.type === "must_win_round2" && (
                  <div className="level-constraint-badge level-constraint-badge--special">
                    {t("deckbuilder.mustWinRound2")}
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

import { useSaveStore } from "../store/saveStore";
import { useGameStore, CAMPAIGN_LEVELS } from "../store/gameStore";
import { useI18n } from "../i18n/I18nProvider";
import type { Faction } from "@warring-states/game-core";

const DIFFICULTY_STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
const PLAYABLE_FACTIONS: Faction[] = ["qin", "chu", "qi", "zhao"];
const FACTION_COLOR: Record<Faction, string> = {
  qin: "var(--qin)",
  chu: "var(--chu)",
  qi: "var(--qi)",
  zhao: "var(--zhao)",
  neutral: "var(--neutral, #888)",
};

export function LevelSelectScreen() {
  const selectLevel = useGameStore((s) => s.selectLevel);
  const restart     = useGameStore((s) => s.restart);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const setPlayerFaction = useGameStore((s) => s.setPlayerFaction);
  const campaignFactionChosen = useGameStore((s) => s.campaignFactionChosen);
  const campaignFactionLocked = useGameStore((s) => s.campaignFactionLocked);
  const currentProfileId = useSaveStore((s) => s.currentProfileId);
  const progress         = useSaveStore((s) => s.progress);
  const isComplete = (levelId: string) => (progress[currentProfileId] ?? []).includes(levelId);
  const { t }       = useI18n();

  return (
    <div className="level-select-screen">
      <header className="level-select-header">
        <button className="btn-back" onClick={restart}>
          ← {t("levelselect.back")}
        </button>
        <h1 className="level-select-title">{t("levelselect.title")}</h1>
        <p className="level-select-subtitle">{t("levelselect.subtitle")}</p>
        {!campaignFactionLocked ? (
          <div className="campaign-faction-selector">
            <span className="campaign-faction-selector__label">
              {t("levelselect.campaignFaction")}
            </span>
            <div className="campaign-faction-selector__buttons">
              {PLAYABLE_FACTIONS.map((faction) => (
                <button
                  key={faction}
                  className={`campaign-faction-btn${campaignFactionChosen && playerFaction === faction ? " campaign-faction-btn--active" : ""}`}
                  style={
                    campaignFactionChosen && playerFaction === faction
                      ? { borderColor: FACTION_COLOR[faction], color: FACTION_COLOR[faction] }
                      : {}
                  }
                  onClick={() => setPlayerFaction(faction)}
                >
                  {t(`faction.${faction}.name`)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="campaign-faction-locked">
            <span className="campaign-faction-selector__label">
              {t("levelselect.campaignFaction")}
            </span>
            <span
              className="campaign-faction-locked__badge"
              style={{ borderColor: FACTION_COLOR[playerFaction], color: FACTION_COLOR[playerFaction] }}
            >
              {t(`faction.${playerFaction}.name`)}
            </span>
          </div>
        )}
        {campaignFactionChosen && (
          <div className="campaign-faction-trait">
            <div className="campaign-faction-trait__name">
              {t(`faction.${playerFaction}.name`)}
            </div>
            <p>{t(`faction.${playerFaction}.trait`)}</p>
          </div>
        )}
      </header>

      {!campaignFactionChosen && (
        <div className="level-select-hint">
          {t("levelselect.chooseFactionFirst")}
        </div>
      )}

      <div className="level-grid">
        {CAMPAIGN_LEVELS.map((level, i) => {
          const done = isComplete(level.id);
          const isCampaignCleared = isComplete("level-6-apex");
          const isUnlocked =
            isCampaignCleared ||
            i === 0 ||
            isComplete(CAMPAIGN_LEVELS[i - 1].id);
          const disabled = !campaignFactionChosen || !isUnlocked;
          return (
            <button
              key={level.id}
              id={`level-card-${i + 1}`}
              className={`level-card ${done ? "level-card--done" : ""} ${!isUnlocked ? "level-card--locked" : ""} ${disabled ? "level-card--disabled" : ""}`}
              disabled={disabled}
              onClick={() => selectLevel(level)}
            >
              <div className="level-card-number">{!isUnlocked ? "🔒" : (done ? "✓" : i + 1)}</div>
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

import { useState, useMemo } from "react";
import { useSaveStore } from "../store/saveStore";
import { useGameStore, CAMPAIGN_LEVELS } from "../store/gameStore";
import { useI18n } from "../i18n/I18nProvider";
import { getFactionDeckStats, isLevelUnlocked } from "@warring-states/game-core";
import type { Faction } from "@warring-states/game-core";

const PLAYABLE_FACTIONS: Faction[] = ["qin", "chu", "qi", "zhao"];
const FACTION_COLOR: Record<Faction, string> = {
  qin: "var(--qin)",
  chu: "var(--chu)",
  qi: "var(--qi)",
  zhao: "var(--zhao)",
  neutral: "var(--neutral, #888)",
};
const FACTION_SEAL: Record<Faction, string> = {
  qin: "秦",
  chu: "楚",
  qi: "齐",
  zhao: "赵",
  neutral: "策",
};
const DIFFICULTY_STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function LevelSelectScreen() {
  const selectLevel = useGameStore((s) => s.selectLevel);
  const restart = useGameStore((s) => s.restart);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const setPlayerFaction = useGameStore((s) => s.setPlayerFaction);
  const campaignFactionChosen = useGameStore((s) => s.campaignFactionChosen);
  const campaignFactionLocked = useGameStore((s) => s.campaignFactionLocked);
  const currentProfileId = useSaveStore((s) => s.currentProfileId);
  const progress = useSaveStore((s) => s.progress);
  const completedIds = progress[currentProfileId] ?? [];
  const { t } = useI18n();

  const lastLevelId = CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.length - 1].id;
  const isCampaignCleared = completedIds.includes(lastLevelId);

  // Which stage is focused in the detail panel.
  const firstUnlockedIdx = CAMPAIGN_LEVELS.findIndex((_, i) =>
    isLevelUnlocked(i, completedIds, lastLevelId),
  );
  const [focusedIdx, setFocusedIdx] = useState(
    firstUnlockedIdx >= 0 ? firstUnlockedIdx : 0,
  );

  const focusedLevel = CAMPAIGN_LEVELS[focusedIdx];
  const focusedUnlocked = isLevelUnlocked(focusedIdx, completedIds, lastLevelId);
  const focusedDone = completedIds.includes(focusedLevel?.id ?? "");

  const factionStats = useMemo(
    () =>
      Object.fromEntries(
        PLAYABLE_FACTIONS.map((f) => [f, getFactionDeckStats(f)]),
      ) as Record<Faction, ReturnType<typeof getFactionDeckStats>>,
    [],
  );

  return (
    <div className="campaign-screen">
      {/* ── Top bar: light back link + title ── */}
      <div className="campaign-topbar">
        <button className="campaign-back" onClick={restart}>
          ← {t("levelselect.back")}
        </button>
        <div className="campaign-topbar__divider">|</div>
        <span className="campaign-topbar__title">{t("levelselect.title")}</span>
        <span className="campaign-topbar__desc">
          {t("levelselect.subtitle")}
        </span>
        {isCampaignCleared && (
          <span className="campaign-topbar__cleared">
            — {t("campaign.cleared")}
          </span>
        )}
      </div>

      {/* ── Faction Selection Row ── */}
      {!campaignFactionLocked && (
        <div className="campaign-faction-row">
          {PLAYABLE_FACTIONS.map((faction) => {
            const stats = factionStats[faction];
            const active = campaignFactionChosen && playerFaction === faction;
            return (
              <button
                key={faction}
                className={`faction-hero-card${active ? " faction-hero-card--active" : ""}`}
                style={
                  active
                    ? { borderColor: FACTION_COLOR[faction] }
                    : {}
                }
                onClick={() => setPlayerFaction(faction)}
              >
                <span
                  className="faction-hero-card__seal"
                  style={{ color: FACTION_COLOR[faction] }}
                >
                  {FACTION_SEAL[faction]}
                </span>
                <div className="faction-hero-card__body">
                  <span className="faction-hero-card__name">
                    {t(`faction.${faction}.name`)}
                  </span>
                  <span className="faction-hero-card__style">
                    {t(`faction.${faction}.styleTag`)}
                  </span>
                  <span className="faction-hero-card__meta">
                    {t(`faction.${faction}.beginnerTag`)} ·{" "}
                    {t("campaign.factionCards", { count: stats.total })}
                  </span>
                  <span className="faction-hero-card__policy">
                    {t(`policy.${faction}.name`)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Locked faction badge (shown when faction is locked) ── */}
      {campaignFactionLocked && (
        <div className="campaign-faction-row campaign-faction-row--locked">
          <span
            className="faction-locked-pill"
            style={{
              borderColor: FACTION_COLOR[playerFaction],
              color: FACTION_COLOR[playerFaction],
            }}
          >
            {FACTION_SEAL[playerFaction]} {t(`faction.${playerFaction}.name`)}
          </span>
        </div>
      )}

      {/* ── Prompt if no faction chosen ── */}
      {!campaignFactionChosen && (
        <div className="campaign-prompt">
          {t("levelselect.chooseFactionFirst")}
        </div>
      )}

      {/* ── Three-column body (shown after faction chosen) ── */}
      {campaignFactionChosen && (
        <div className="campaign-body">
          {/* ═══ Column 1: Faction Detail ═══ */}
          <aside className="campaign-col campaign-col--faction">
            {(() => {
              const stats = factionStats[playerFaction];
              return (
                <div className="faction-detail-panel">
                  <div className="faction-detail-panel__header">
                    <span
                      className="faction-detail-panel__seal"
                      style={{ color: FACTION_COLOR[playerFaction] }}
                    >
                      {FACTION_SEAL[playerFaction]}
                    </span>
                    <div>
                      <h2 className="faction-detail-panel__name">
                        {t(`faction.${playerFaction}.name`)}
                      </h2>
                      <span className="faction-detail-panel__style">
                        {t(`faction.${playerFaction}.styleTag`)} ·{" "}
                        {t(`faction.${playerFaction}.beginnerTag`)}
                      </span>
                    </div>
                  </div>

                  <p className="faction-detail-panel__trait">
                    {t(`faction.${playerFaction}.trait`)}
                  </p>

                  <div className="faction-detail-panel__section">
                    <h3>{t("campaign.factionCards", { count: stats.total })}</h3>
                    <div className="faction-stat-grid">
                      <div className="faction-stat-item">
                        <span className="faction-stat-item__value">{stats.units}</span>
                        <span className="faction-stat-item__label">
                          {t("cardtype.unit")}
                        </span>
                      </div>
                      <div className="faction-stat-item">
                        <span className="faction-stat-item__value">{stats.specials}</span>
                        <span className="faction-stat-item__label">
                          {t("cardtype.special")}
                        </span>
                      </div>
                      <div className="faction-stat-item">
                        <span className="faction-stat-item__value">{stats.melee}</span>
                        <span className="faction-stat-item__label">
                          {t("row.melee")}
                        </span>
                      </div>
                      <div className="faction-stat-item">
                        <span className="faction-stat-item__value">{stats.ranged}</span>
                        <span className="faction-stat-item__label">
                          {t("row.ranged")}
                        </span>
                      </div>
                      <div className="faction-stat-item">
                        <span className="faction-stat-item__value">{stats.siege}</span>
                        <span className="faction-stat-item__label">
                          {t("row.siege")}
                        </span>
                      </div>
                      <div className="faction-stat-item">
                        <span className="faction-stat-item__value">{stats.avgPower}</span>
                        <span className="faction-stat-item__label">
                          {t("deckbuilder.avgPower")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="faction-detail-panel__policy">
                    {t("game.policySlot", { policy: t(`policy.${playerFaction}.name`) })}
                  </div>
                </div>
              );
            })()}
          </aside>

          {/* ═══ Column 2: Route Timeline ═══ */}
          <section className="campaign-col campaign-col--route">
            <h2 className="campaign-col__heading">
              {t("campaign.routeTitle")}
            </h2>
            <div className="route-timeline">
              {CAMPAIGN_LEVELS.map((level, i) => {
                const unlocked = isLevelUnlocked(i, completedIds, lastLevelId);
                const done = completedIds.includes(level.id);
                const isFocused = i === focusedIdx;

                return (
                  <button
                    key={level.id}
                    className={`route-node${done ? " route-node--done" : ""}${!unlocked ? " route-node--locked" : ""}${isFocused ? " route-node--focused" : ""}`}
                    disabled={!unlocked}
                    onClick={() => setFocusedIdx(i)}
                  >
                    <span className="route-node__circle">
                      {!unlocked ? "🔒" : done ? "✓" : i + 1}
                    </span>
                    <div className="route-node__body">
                      <span className="route-node__title">{level.title}</span>
                      <span className="route-node__meta">
                        {DIFFICULTY_STARS(level.difficulty)} ·{" "}
                        {t(`faction.${level.opponentFaction}.name`)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ═══ Column 3: Stage Detail ═══ */}
          <aside className="campaign-col campaign-col--detail">
            <h2 className="campaign-col__heading">
              {t("campaign.stageDetail")}
            </h2>

            <div className="stage-detail-card">
              <div className="stage-detail-card__header">
                <h3 className="stage-detail-card__title">
                  {focusedLevel.title}
                </h3>
                <p className="stage-detail-card__subtitle">
                  {t(focusedLevel.subtitleTextId)}
                </p>
              </div>

              <div className="stage-detail-card__meta">
                <span className="stage-meta-tag">
                  {DIFFICULTY_STARS(focusedLevel.difficulty)}
                </span>
                <span className="stage-meta-tag">
                  {t("levelselect.vs")}{" "}
                  {t(`faction.${focusedLevel.opponentFaction}.name`)}
                </span>
                {focusedLevel.winCondition.type === "must_win_round2" && (
                  <span className="stage-meta-tag stage-meta-tag--warn">
                    {t("deckbuilder.mustWinRound2")}
                  </span>
                )}
              </div>

              <div className="stage-detail-card__section">
                <h4>{t("campaign.enemyMechanic")}</h4>
                <p>{t(`level.${focusedLevel.id}.mechanic`)}</p>
              </div>

              <div className="stage-detail-card__section">
                <h4>{t("campaign.learningGoal")}</h4>
                <p>{t(`level.${focusedLevel.id}.goal`)}</p>
              </div>

              <div className="stage-detail-card__actions">
                {focusedDone ? (
                  <div className="stage-done-badge">✓</div>
                ) : focusedUnlocked ? (
                  <button
                    className="btn-start-stage"
                    onClick={() => selectLevel(focusedLevel)}
                  >
                    ⚔ {t("campaign.startChallenge")}
                  </button>
                ) : (
                  <p className="stage-locked-msg">
                    {t("campaign.lockedReason")}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

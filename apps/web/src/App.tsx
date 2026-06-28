import { useState, useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import { useSaveStore } from "./store/saveStore";
import { PlayerBoard } from "./components/PlayerBoard";
import { HandView } from "./components/HandView";
import { LevelSelectScreen } from "./components/LevelSelectScreen";
import { DeckBuilderScreen } from "./components/DeckBuilderScreen";
import { useI18n } from "./i18n/I18nProvider";
import { getCardDescription, getCardName } from "./i18n/i18n";
import type { Faction, CardDefinition, EffectDefinition, GameActionLogEntry } from "@warring-states/game-core";

const FACTIONS: { value: Faction; icon: string; fallback: string }[] = [
  { value: "qin", icon: "🔴", fallback: "Qin" },
  { value: "chu", icon: "🔵", fallback: "Chu" },
  { value: "qi", icon: "🟡", fallback: "Qi" },
  { value: "zhao", icon: "🟢", fallback: "Zhao" },
];

const FACTION_MARK: Record<Faction, string> = {
  qin: "秦",
  chu: "楚",
  qi: "齐",
  zhao: "赵",
  neutral: "策",
};


// ──────────────────────────────────────────
// Start Screen
// ──────────────────────────────────────────

function StartScreen() {
  const { startGame, playerFaction, opponentFaction, setPlayerFaction, setOpponentFaction, goToLevelSelect } =
    useGameStore();
  const { language, setLanguage, t } = useI18n();
  const [showQuickBattleModal, setShowQuickBattleModal] = useState(false);

  return (
    <div className="start-screen">
      <div className="start-card">
        {/* Settings button in the top right corner */}
        <button
          className="home-settings-btn"
          disabled
          aria-label="Settings"
          title={t("profile.title")}
        >
          ⚙
        </button>

        {/* Centered Language Switcher */}
        <div className="language-switcher" aria-label={t("common.language")}>
          <button
            className={`language-switcher__button${language === "en" ? " language-switcher__button--active" : ""}`}
            onClick={() => setLanguage("en")}
          >
            {t("common.english")}
          </button>
          <button
            className={`language-switcher__button${language === "zh" ? " language-switcher__button--active" : ""}`}
            onClick={() => setLanguage("zh")}
          >
            {t("common.chinese")}
          </button>
        </div>

        {/* Title & Brand */}
        <div className="start-hero">
          <p className="eyebrow">{t("app.eyebrow")}</p>
          <h1>{t("app.title")}</h1>
          
          {/* Symmetrical Title Divider */}
          <div className="title-divider">
            <div className="title-divider-line"></div>
            <div className="title-divider-diamond"></div>
            <div className="title-divider-line"></div>
          </div>

          <p className="subtitle">
            {t("start.heroSubtitle")}
          </p>
        </div>

        {/* Menu Options */}
        <div className="start-main-menu">
          <button
            id="btn-campaign"
            className="start-menu-card start-menu-card--primary"
            onClick={goToLevelSelect}
          >
            <span className="start-menu-card__icon">
              {/* City Gate SVG */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "38px", height: "38px" }}>
                <path d="M2 20h20" />
                <path d="M5 17v-4a7 7 0 0 1 14 0v4" />
                <path d="M12 9v11" />
                <rect x="9" y="14" width="6" height="6" rx="1" />
                <path d="M3 20v-5h18v5" />
              </svg>
            </span>
            <span className="start-menu-card__body">
              <span className="start-menu-card__title">{t("start.campaign")}</span>
              <span className="start-menu-card__desc">
                {t("start.campaignDesc")}
              </span>
            </span>
            <span className="start-menu-card__arrow">›</span>
          </button>

          <button
            id="btn-start"
            className="start-menu-card"
            onClick={() => setShowQuickBattleModal(true)}
          >
            <span className="start-menu-card__icon">
              {/* Crossed Flags SVG */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "38px", height: "38px" }}>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
                <path d="M20 15s-1-1-4-1-5 2-8 2-4-1-4-1V3s1 1 4 1 5-2 8-2 4 1 4 1z" />
                <line x1="20" y1="22" x2="20" y2="15" />
              </svg>
            </span>
            <span className="start-menu-card__body">
              <span className="start-menu-card__title">{t("start.quickBattle")}</span>
              <span className="start-menu-card__desc">
                {t("start.quickBattleDesc")}
              </span>
            </span>
            <span className="start-menu-card__arrow">›</span>
          </button>
        </div>

        {/* Symmetrical Stamp Ornament */}
        <div className="start-footer-ornament">
          <div className="ornament-line"></div>
          <div className="stamp-circle">
            <span>策</span>
          </div>
          <div className="ornament-line"></div>
        </div>
      </div>

      {/* Quick Battle Faction Selector Modal */}
      {showQuickBattleModal && (
        <div className="modal-overlay">
          <div className="modal-content faction-picker-modal">
            <h2 className="modal-title">⚔️ {t("start.quickBattle")}</h2>
            
            <div className="faction-select-grid">
              <div className="faction-select-group">
                <h3>🔴 {t("start.yourFaction")}</h3>
                <div className="faction-buttons">
                  {FACTIONS.map((f) => (
                    <button
                      key={f.value}
                      className={`faction-btn faction-btn--${f.value} ${playerFaction === f.value ? "active" : ""}`}
                      onClick={() => setPlayerFaction(f.value)}
                    >
                      <span className="faction-icon">{f.icon}</span>
                      <span className="faction-name">{t(`faction.${f.value}.name`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="faction-select-group">
                <h3>🔵 {t("start.opponentFaction")}</h3>
                <div className="faction-buttons">
                  {FACTIONS.map((f) => (
                    <button
                      key={f.value}
                      className={`faction-btn faction-btn--${f.value} ${opponentFaction === f.value ? "active" : ""}`}
                      onClick={() => setOpponentFaction(f.value)}
                    >
                      <span className="faction-icon">{f.icon}</span>
                      <span className="faction-name">{t(`faction.${f.value}.name`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn--outline"
                onClick={() => setShowQuickBattleModal(false)}
              >
                {t("profile.close")}
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setShowQuickBattleModal(false);
                  startGame(playerFaction, opponentFaction);
                }}
              >
                ⚔️ {t("start.quickBattle")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function BattleIdentityBar({
  side,
  faction,
  handCount,
  deckCount,
  hasPassed,
  t,
}: {
  side: "player" | "opponent";
  faction: Faction;
  handCount: number;
  deckCount: number;
  hasPassed: boolean;
  t: (id: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className={`battle-identity battle-identity--${side}`}>
      <span className="battle-identity__seal">{FACTION_MARK[faction]}</span>
      <span className="battle-identity__name">{t(`faction.${faction}.name`)}</span>
      <span className="battle-identity__policy">
        {t("game.policySlot", { policy: t(`policy.${faction}.name`) })}
      </span>
      <span>{t("board.hand", { count: handCount })}</span>
      <span>{t("board.deck", { count: deckCount })}</span>
      {hasPassed && (
        <span className="meta-badge passed-badge" style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", background: "rgba(139,26,26,0.15)" }}>
          {t("board.passed")}
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Round Result Banner
// ──────────────────────────────────────────
function RoundResultBanner() {
  const { gameState, startNextRound } = useGameStore();
  const { t } = useI18n();
  if (!gameState || gameState.status !== "round_finished") return null;

  const { roundWinnerId, currentRound, players } = gameState;
  const roundLabel = roundWinnerId
    ? roundWinnerId === "player"
      ? `🏆 ${t("round.playerWon")}`
      : `💀 ${t("round.opponentWon")}`
    : `🤝 ${t("round.draw")}`;

  return (
    <div className="round-banner">
      <div className="round-banner__inner">
        <div className="round-banner__title">{t("round.title", { round: currentRound })}</div>
        <div className="round-banner__result">{roundLabel}</div>
        <div className="round-banner__wins">
          <span>🔴 {t(`faction.${players.player.faction}.name`)}: {t("common.roundWins", { count: players.player.roundWins, suffix: players.player.roundWins !== 1 ? "s" : "" })}</span>
          <span>🔵 {t(`faction.${players.opponent.faction}.name`)}: {t("common.roundWins", { count: players.opponent.roundWins, suffix: players.opponent.roundWins !== 1 ? "s" : "" })}</span>
        </div>
        <button
          id="btn-next-round"
          className="btn btn--primary"
          onClick={startNextRound}
        >
          ▶ {t("round.startNext", { round: currentRound + 1 })}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Game Screen
// ──────────────────────────────────────────
function GameScreen() {
  const { gameState, playCard, pass, scores, hoveredCard, selectedLevel, campaignMode, restart, startLevelGame, startGame, playerFaction, opponentFaction } = useGameStore();
  const { t } = useI18n();

  // State hooks
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  if (!gameState) return null;

  function getEffectLogDetail(effect: EffectDefinition): string {
    switch (effect.type) {
      case "DAMAGE":
        return t("game.logEffectDamage", { amount: effect.amount });
      case "BUFF":
      case "CONDITIONAL_BOOST":
        return t("game.logEffectBoost", { amount: effect.amount });
      case "SUMMON":
        return t("game.logEffectSummon");
      case "LOCK":
        return t("game.logEffectLock");
      case "REVIVE":
        return t("game.logEffectRevive");
      case "DRAW_DISCARD":
        return t("game.logEffectDrawDiscard", {
          draw: effect.draw,
          discard: effect.discard,
        });
      case "DESTROY":
        return t("game.logEffectDestroy");
      case "CLEAR_WEATHER":
        return t("game.logEffectClearWeather");
    }
  }

  /** Resolve a raw GameActionLogEntry to a readable, descriptive string. */
  function resolveActionLogEntry(entry: GameActionLogEntry): string {
    if (!gameState) return "";
    if (entry.message === "PASS") {
      const sideName = entry.playerId === "player" ? t("player.you") : t("player.opponent");
      return t("game.logPass", { player: sideName });
    }
    if (entry.message === "START_NEXT_ROUND") {
      return t("game.logRoundStarted", { round: entry.round });
    }
    if (entry.message === "PLAY_CARD") {
      const sideName = entry.playerId === "player" ? t("player.you") : t("player.opponent");
      if (entry.cardId) {
        const cardDef = gameState.cardDefinitions[entry.cardId];
        const cardName = cardDef ? getCardName(t, cardDef, entry.cardId) : entry.cardId;
        const basePower = cardDef ? cardDef.power : 0;
        
        let effectDetail = "";
        if (cardDef && cardDef.effects && cardDef.effects.length > 0) {
          effectDetail = getEffectLogDetail(cardDef.effects[0]);
        }
        
        return t("game.logPlayCard", {
          player: sideName,
          card: cardName,
          power: basePower,
          effect: effectDetail,
        });
      }
      return t("game.logPlayUnknown", { player: sideName });
    }
    return entry.message;
  }

  const s = scores();
  const { player, opponent } = gameState.players;
  const round = gameState.currentRound;

  const isPlaying = gameState.status === "playing";
  const isRoundOver = gameState.status === "round_finished";
  const isPlayerTurn = isPlaying && gameState.currentPlayerId === "player";
  const canPlay = isPlayerTurn && !player.hasPassed;

  const actionHint = isRoundOver
    ? t("game.roundOverStatus")
    : isPlayerTurn && !player.hasPassed
      ? (opponent.hasPassed ? t("game.opponentPassed") : t("game.yourTurn"))
      : player.hasPassed
        ? t("game.playerPassed")
        : t("game.opponentTurn");

  // Determine opponent passive style info
  const opponentIntelTitle = campaignMode && selectedLevel
    ? selectedLevel.title
    : t(`faction.${opponent.faction}.name`);

  const opponentIntelBody = t(`faction.${opponent.faction}.battleStyle`);

  const opponentIntelHint = campaignMode && selectedLevel
    ? t(selectedLevel.hintTextId)
    : t("game.quickBattleIntel");

  // Determine highlighted row based on selection
  const selectedInstance = player.hand.find((c) => c.instanceId === selectedCardId);
  const selectedDef = selectedInstance ? gameState.cardDefinitions[selectedInstance.cardId] : null;
  const highlightedRow = selectedDef
    ? (selectedDef.type === "special" ? "all" : selectedDef.row)
    : null;
  const displayCard = hoveredCard || selectedDef;

  // Handle hand card click
  const handleHandCardClick = (cardInstanceId: string) => {
    if (selectedCardId === cardInstanceId) {
      // Double click confirmation plays card directly to preferred row
      playCard(cardInstanceId);
      setSelectedCardId(null);
    } else {
      setSelectedCardId(cardInstanceId);
      // Auto-preview hovered card details
      const cardInst = player.hand.find((c) => c.instanceId === cardInstanceId);
      if (cardInst) {
        const def = gameState.cardDefinitions[cardInst.cardId];
        if (def) useGameStore.getState().setHoveredCard(def);
      }
    }
  };

  // Handle row placement click
  const handleRowClick = (row: typeof highlightedRow) => {
    if (!canPlay || !selectedCardId || !selectedDef) return;
    if (selectedDef.type === "unit" && selectedDef.row !== row) return;
    playCard(selectedCardId);
    setSelectedCardId(null);
  };

  // Restart active battle
  const handleRestartMatch = () => {
    setShowSettingsModal(false);
    setSelectedCardId(null);
    if (campaignMode && selectedLevel) {
      startLevelGame();
    } else {
      startGame(playerFaction, opponentFaction);
    }
  };

  // Dynamically build glossary for hovered card
  function getCardKeywordsGlossary(card: CardDefinition) {
    const types = card.effects.map((effect) => effect.type);
    const keywords: { name: string; desc: string }[] = [];
    if (types.includes("LOCK")) keywords.push({ name: t("glossary.lock.name"), desc: t("glossary.lock.desc") });
    if (types.includes("REVIVE")) keywords.push({ name: t("glossary.revive.name"), desc: t("glossary.revive.desc") });
    if (card.type === "special") keywords.push({ name: t("glossary.special.name"), desc: t("glossary.special.desc") });
    if (types.includes("SUMMON")) keywords.push({ name: t("glossary.summon.name"), desc: t("glossary.summon.desc") });
    if (types.includes("CONDITIONAL_BOOST")) keywords.push({ name: t("glossary.boost.name"), desc: t("glossary.boost.desc") });
    
    if (keywords.length === 0) return null;
    
    return (
      <div className="card-keywords-glossary">
        <h3 className="keywords-glossary-title">{t("glossary.keywordTitle")}</h3>
        {keywords.map((kw, i) => (
          <div key={i} className="glossary-item">
            <span className="glossary-item__name">{kw.name}</span>
            <p className="glossary-item__desc">{kw.desc}</p>
          </div>
        ))}
      </div>
    );
  }



  return (
    <div className="game-screen">
      
      {/* LEFT BOARD WRAPPER */}
      <div className="battle-board-left">
        
        {/* Opponent Info Header Strip */}
        <div className="battle-identity-wrapper battle-identity-wrapper--opponent">
          <BattleIdentityBar
            side="opponent"
            faction={opponent.faction}
            handCount={opponent.hand.length}
            deckCount={opponent.deck.length}
            hasPassed={opponent.hasPassed}
            t={t}
          />
          <button
            className="settings-cog-btn"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Settings"
            title={t("profile.title")}
          >
            ⚙
          </button>
        </div>

        {/* Opponent Board Rows */}
        <div className="rows-container rows-container--opponent">
          <PlayerBoard
            player={opponent}
            label={`🔵 ${t("player.opponent")}`}
            isActive={gameState.currentPlayerId === "opponent" && isPlaying}
            score={s?.opponent ?? 0}
            rowOrder={["siege", "ranged", "melee"]}
            cardDefinitions={gameState.cardDefinitions}
            t={t}
            hideHeader
          />
        </div>

        {/* Middle HUD status bar */}
        <div className="battle-status-bar">
          <div className="battle-status-bar__round-pill">
            {t("game.smallRound", { round })}
          </div>
          <div className="battle-status-bar__scores">
            <span className="score-label score-label--opponent">{t("player.opponent")}</span>
            <span className="score-num score-num--opponent">{s?.opponent ?? 0}</span>
            <span className="score-colon">:</span>
            <span className="score-num score-num--player">{s?.player ?? 0}</span>
            <span className="score-label score-label--player">{t("player.you")}</span>
          </div>
          <div className="battle-status-bar__turn-indicator">
            <span className="turn-icon">{isPlayerTurn ? "⚔️" : "🛡️"}</span>
            <div className="turn-text">
              <div className="turn-title">{isPlayerTurn ? t("game.yourTurn") : t("game.opponentTurn")}</div>
              <div className="turn-subtitle">{actionHint}</div>
            </div>
          </div>
        </div>

        {/* Player Board Rows */}
        <div className="rows-container rows-container--player">
          <PlayerBoard
            player={player}
            label={`🔴 ${t("player.you")}`}
            isActive={isPlayerTurn}
            score={s?.player ?? 0}
            rowOrder={["melee", "ranged", "siege"]}
            cardDefinitions={gameState.cardDefinitions}
            t={t}
            hideHeader
            highlightedRow={highlightedRow}
            onRowClick={handleRowClick}
          />
        </div>

        {/* Player Info Footer Strip */}
        <div className="battle-identity-wrapper battle-identity-wrapper--player">
          <BattleIdentityBar
            side="player"
            faction={player.faction}
            handCount={player.hand.length}
            deckCount={player.deck.length}
            hasPassed={player.hasPassed}
            t={t}
          />
        </div>

        {/* Hand Cards Area */}
        <div className="battle-hand-wrapper">
          <div className="battle-hand-container">
            <HandView
              cards={player.hand}
              cardDefinitions={gameState.cardDefinitions}
              canPlay={canPlay}
              onPlay={handleHandCardClick}
              t={t}
              selectedCardId={selectedCardId}
            />
          </div>
          <div className="battle-actions-container">
            {/* Policy skill slot placeholder (disabled) */}
            <button
              className="battle-action-btn battle-action-btn--policy"
              disabled
              title={t("game.policyDisabled")}
            >
              <span className="btn-icon">📜</span>
              <span className="btn-text">
                <span className="btn-title">{t("game.usePolicy", { policy: "" })}</span>
                <span className="btn-subtitle">{t(`policy.${player.faction}.name`)} 1/1</span>
              </span>
            </button>
            <button
              className="battle-action-btn battle-action-btn--pass"
              onClick={() => {
                if (canPlay) {
                  setSelectedCardId(null);
                  pass();
                }
              }}
              disabled={!canPlay}
              title={t("game.passRound")}
            >
              <span className="btn-text">
                <span className="btn-title">{t("game.passRound")}</span>
                <span className="btn-subtitle">PASS</span>
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT STATIC SIDEBAR PANEL */}
      <aside className="game-sidebar" style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", boxSizing: "border-box" }}>
        
        {/* 1. Card Details Preview (Fixed slot at the top) */}
        {displayCard ? (
          <div className={`sidebar-card-frame sidebar-card-frame--${displayCard.rarity} sidebar-card-frame--${displayCard.faction}`} style={{ height: "280px", display: "flex", flexDirection: "column", minHeight: "280px", boxSizing: "border-box" }}>
            <div className="sidebar-card-header">
              <span className="sidebar-card-power">{displayCard.power}</span>
              <span className="sidebar-card-name">{getCardName(t, displayCard, displayCard.id)}</span>
            </div>
            <div className="preview-frame-metadata">
              <span className={`preview-badge badge-faction badge-faction--${displayCard.faction}`}>
                {t(`faction.${displayCard.faction}.name`)}
              </span>
              {displayCard.row && (
                <span className="preview-badge badge-row">
                  {t(`row.${displayCard.row}`)}
                </span>
              )}
              <span className={`preview-badge badge-rarity badge-rarity--${displayCard.rarity}`}>
                {t(`rarity.${displayCard.rarity}`)}
              </span>
              <span className={`preview-badge badge-type badge-type--${displayCard.type}`}>
                {t(`cardtype.${displayCard.type}`)}
              </span>
            </div>
            <div className="preview-frame-body" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p className="preview-frame-desc" style={{ margin: 0 }}>{getCardDescription(t, displayCard)}</p>
              {/* Contextual glossary for card skills */}
              {getCardKeywordsGlossary(displayCard)}
            </div>
          </div>
        ) : (
          /* Placeholder when no card is hovered/selected */
          <div className="sidebar-card-frame sidebar-card-frame--placeholder" style={{ height: "280px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "280px", border: "1px dashed rgba(201,168,76,0.3)", background: "rgba(0,0,0,0.15)", boxSizing: "border-box", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px", opacity: 0.5 }}>🎴</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: "bold" }}>
              {t("game.cardDetails")}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#8c7a5c", marginTop: "4px", lineHeight: "1.3" }}>
              {t("game.cardDetailsHint")}
            </div>
          </div>
        )}

        {/* 2. Enemy Passive Mechanic */}
        <div className="sidebar-card-frame sidebar-intel-card" style={{ flexShrink: 0 }}>
          <h2 className="glossary-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>⚙️</span> {t("game.enemyMechanic")}
          </h2>
          <div className="intel-body" style={{ padding: "8px 0" }}>
            <div className="intel-style" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--gold)", marginBottom: "4px" }}>
              {opponentIntelTitle}
            </div>
            <div className="intel-desc" style={{ fontSize: "0.76rem", color: "var(--text-dim)", lineHeight: "1.4" }}>
              {opponentIntelBody}
            </div>
            <div className="intel-hint" style={{ fontSize: "0.7rem", color: "#8c7a5c", marginTop: "8px", fontStyle: "italic", borderTop: "1px dashed rgba(201,168,76,0.15)", paddingTop: "6px" }}>
              {opponentIntelHint}
            </div>
          </div>
        </div>

        {/* 3. Recent Action Logs */}
        <div className="sidebar-card-frame sidebar-logs-card" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <h2 className="glossary-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>📜</span> {t("game.recentActions")}
          </h2>
          <div className="recent-logs-list" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", padding: "8px 0" }}>
            {gameState.actionLog.slice(-5).reverse().map((entry, index) => {
              const icon = entry.playerId === "player" ? "⚔️" : "🎌";
              const isPlayer = entry.playerId === "player";
              return (
                <div key={index} className={`recent-log-item recent-log-item--${isPlayer ? "player" : "opponent"}`} style={{ display: "flex", gap: "8px", fontSize: "0.72rem", padding: "6px 8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "4px" }}>
                  <span className="log-icon">{icon}</span>
                  <span className="log-text" style={{ color: isPlayer ? "#ffb6b6" : "#b6d8ff" }}>{resolveActionLogEntry(entry)}</span>
                </div>
              );
            })}
            {gameState.actionLog.length === 0 && (
              <div className="recent-log-empty" style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                {t("history.empty")}
              </div>
            )}
          </div>
        </div>

      </aside>


      {/* BATTLE SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content settings-modal">
            <h2 className="modal-title">⚙️ {t("profile.title")}</h2>
            <div className="settings-options" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "16px 0" }}>
              <button
                className="btn btn--outline"
                style={{ padding: "12px", fontSize: "0.95rem" }}
                onClick={handleRestartMatch}
              >
                ↩️ {t("game.restartMatch")}
              </button>
              <button
                className="btn btn--danger"
                style={{ padding: "12px", fontSize: "0.95rem" }}
                onClick={() => {
                  setShowSettingsModal(false);
                  setSelectedCardId(null);
                  restart();
                }}
              >
                🚪 {t("game.exitToMainMenu")}
              </button>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn--primary"
                onClick={() => setShowSettingsModal(false)}
              >
                {t("profile.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Round result overlay banner ── */}
      <RoundResultBanner />
    </div>
  );
}

// ──────────────────────────────────────────
// Result Screen
// ──────────────────────────────────────────
function ResultScreen() {
  const { gameState, restart, campaignMode, selectedLevel, levelPassed } = useGameStore();
  const markComplete = useSaveStore((s) => s.markComplete);
  const goToLevelSelect = useGameStore((s) => s.goToLevelSelect);
  const { t } = useI18n();
  const passed = campaignMode ? levelPassed() : null;

  useEffect(() => {
    if (campaignMode && passed && selectedLevel) {
      markComplete(selectedLevel.id);
    }
  }, [campaignMode, markComplete, passed, selectedLevel]);

  if (!gameState) return null;

  const winner = gameState.winnerId;
  const { player, opponent } = gameState.players;
  const winnerLabel =
    winner === "player"
      ? `🔴 ${t("result.winner", { faction: t(`faction.${player.faction}.name`) })}`
      : `🔵 ${t("result.winner", { faction: t(`faction.${opponent.faction}.name`) })}`;

  return (
    <div className="result-screen">
      <div className="result-card">
        <p className="eyebrow">{t("result.battleConcluded")}</p>
        <h1 className={`result-winner ${winner === "player" ? "result-winner--player" : "result-winner--opponent"}`}>
          {winnerLabel}
        </h1>

        {/* Campaign pass/fail banner */}
        {campaignMode && (
          <div className={`campaign-result-banner ${passed ? "campaign-result-banner--pass" : "campaign-result-banner--fail"}`}>
            {passed ? `✅ ${t("result.levelComplete")}` : `❌ ${t("result.levelFailed")}`}
          </div>
        )}

        <div className="result-stats">
          <div className="result-stat">
            <span className="result-stat__label">🔴 {player.faction}</span>
            <span className="result-stat__value">{t("common.roundWins", { count: player.roundWins, suffix: player.roundWins !== 1 ? "s" : "" })}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">🔵 {opponent.faction}</span>
            <span className="result-stat__value">{t("common.roundWins", { count: opponent.roundWins, suffix: opponent.roundWins !== 1 ? "s" : "" })}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">{t("result.roundsPlayed")}</span>
            <span className="result-stat__value">{gameState.currentRound}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">{t("result.totalActions")}</span>
            <span className="result-stat__value">{gameState.actionLog.length}</span>
          </div>
        </div>

        <div className="result-actions">
          {campaignMode ? (
            <>
              <button
                id="btn-retry"
                className="btn btn--outline btn--large"
                onClick={goToLevelSelect}
              >
                ← {t("result.backToLevels")}
              </button>
              {passed && (
                <button
                  id="btn-next-level"
                  className="btn btn--primary btn--large"
                  onClick={goToLevelSelect}
                >
                  {t("result.nextLevel")} →
                </button>
              )}
            </>
          ) : (
            <button
              id="btn-restart"
              className="btn btn--primary btn--large"
              onClick={restart}
            >
              ↩ {t("result.newBattle")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Root
// ──────────────────────────────────────────
export default function App() {
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    const sessionProfileId = `session-${Date.now()}`;
    const saveStore = useSaveStore.getState();
    saveStore.createProfileWithId(sessionProfileId, `Player ${sessionProfileId.slice(-4)}`);
    saveStore.setCurrentProfile(sessionProfileId);
  }, []);

  return (
    <div className="app-root">
      {screen === "start"        && <StartScreen />}
      {screen === "level_select" && <LevelSelectScreen />}
      {screen === "deck_builder" && <DeckBuilderScreen />}
      {screen === "game"         && <GameScreen />}
      {screen === "result"       && <ResultScreen />}
    </div>
  );
}

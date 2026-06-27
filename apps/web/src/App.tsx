import { useGameStore } from "./store/gameStore";
import type { LogMessage } from "./store/gameStore";
import { useSaveStore } from "./store/saveStore";
import { PlayerBoard } from "./components/PlayerBoard";
import { HandView } from "./components/HandView";
import { LevelSelectScreen } from "./components/LevelSelectScreen";
import { DeckBuilderScreen } from "./components/DeckBuilderScreen";
import { useI18n } from "./i18n/I18nProvider";
import { getCardDescription, getCardName } from "./i18n/i18n";
import type { Faction, GameActionLogEntry, GameState } from "@warring-states/game-core";

const FACTIONS: { value: Faction; icon: string; fallback: string }[] = [
  { value: "qin", icon: "🔴", fallback: "Qin" },
  { value: "chu", icon: "🔵", fallback: "Chu" },
  { value: "qi", icon: "🟡", fallback: "Qi" },
  { value: "zhao", icon: "🟢", fallback: "Zhao" },
];

function RoundDot({ filled }: { filled: boolean }) {
  return <span className={`round-dot${filled ? " round-dot--filled" : ""}`} />;
}

function getActorLabel(
  entry: GameActionLogEntry,
  t: (id: string, params?: Record<string, string | number>) => string,
) {
  if (entry.playerId === "player") return t("history.player");
  if (entry.playerId === "opponent") return t("history.opponent");
  return "";
}

function getHistoryText(
  entry: GameActionLogEntry,
  gameState: GameState,
  t: (id: string, params?: Record<string, string | number>) => string,
) {
  const actor = getActorLabel(entry, t);

  if (entry.message === "PLAY_CARD") {
    const cardName = entry.cardId
      ? t(gameState.cardDefinitions[entry.cardId]?.nameTextId ?? `card.${entry.cardId}.name`)
      : "";
    return t("history.play", { actor, card: cardName || "?" });
  }

  if (entry.message === "PASS") {
    return t("history.pass", { actor });
  }

  if (entry.message === "START_NEXT_ROUND") {
    return t("history.nextRound");
  }

  return entry.message;
}

function ActionHistoryPanel({
  gameState,
  t,
}: {
  gameState: GameState;
  t: (id: string, params?: Record<string, string | number>) => string;
}) {
  const entries = [...gameState.actionLog].reverse();

  return (
    <aside className="action-history">
      <div className="action-history__title">{t("history.title")}</div>
      <div className="action-history__list">
        {entries.length === 0 && (
          <div className="action-history__empty">{t("history.empty")}</div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="action-history__entry">
            <span className="action-history__round">
              {t("history.round", { round: entry.round })}
            </span>
            <span className="action-history__text">
              {getHistoryText(entry, gameState, t)}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────
// Start Screen
// ──────────────────────────────────────────
function StartScreen() {
  const { startGame, playerFaction, opponentFaction, setPlayerFaction, setOpponentFaction, goToLevelSelect } =
    useGameStore();
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="start-screen">
      <div className="start-card">
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
        <p className="eyebrow">{t("app.eyebrow")}</p>
        <h1>{t("app.title")}</h1>
        <p className="subtitle">
          {t("start.subtitle")}
        </p>

        <div className="faction-pickers">
          <div className="faction-picker">
            <label htmlFor="picker-player">{t("start.yourFaction")}</label>
            <select
              id="picker-player"
              value={playerFaction}
              onChange={(e) => setPlayerFaction(e.target.value as Faction)}
            >
              {FACTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.icon} {t(`faction.${f.value}.name`) || f.fallback}
                </option>
              ))}
            </select>
          </div>

          <div className="vs-badge">{t("common.vs")}</div>

          <div className="faction-picker">
            <label htmlFor="picker-opponent">{t("start.opponentFaction")}</label>
            <select
              id="picker-opponent"
              value={opponentFaction}
              onChange={(e) => setOpponentFaction(e.target.value as Faction)}
            >
              {FACTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.icon} {t(`faction.${f.value}.name`) || f.fallback}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="start-actions">
          <button
            id="btn-start"
            className="btn btn--primary btn--large"
            onClick={() => startGame(playerFaction, opponentFaction)}
          >
            ⚔ {t("start.quickBattle")}
          </button>
          <button
            id="btn-campaign"
            className="btn btn--outline btn--large"
            onClick={goToLevelSelect}
          >
            🗺 {t("start.campaign")}
          </button>
        </div>
      </div>
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
  const { gameState, lastAction, playCard, pass, scores, hoveredCard } = useGameStore();
  const { t } = useI18n();

  /** Resolve a structured LogMessage to a translated string. */
  function resolveLog(msg: LogMessage): string {
    const params = msg.params ? { ...msg.params } : {};
    // nameId is itself an i18n key — resolve it first.
    if (typeof params.nameId === "string" && params.nameId) {
      params.name = t(params.nameId);
      delete params.nameId;
    }
    return t(msg.id, params as Record<string, string | number>);
  }

  if (!gameState) return null;

  const s = scores();
  const { player, opponent } = gameState.players;
  const round = gameState.currentRound;

  const isPlaying = gameState.status === "playing";
  const isRoundOver = gameState.status === "round_finished";
  const isPlayerTurn = isPlaying && gameState.currentPlayerId === "player";
  const canPlay = isPlayerTurn && !player.hasPassed;

  return (
    <div className="game-screen">

      {/* ── Opponent (top) ── */}
      <div className="half half--opponent">
        <PlayerBoard
          player={opponent}
          label={`🔵 ${t("player.opponent")}`}
          isActive={gameState.currentPlayerId === "opponent" && isPlaying}
          score={s?.opponent ?? 0}
          rowOrder={["siege", "ranged", "melee"]}
          cardDefinitions={gameState.cardDefinitions}
          t={t}
        />
      </div>

      {/* ── HUD (middle) ── */}
      <div className="hud">
        {/* Player side */}
        <div className="hud__side">
          <span className="hud__faction hud__faction--player">
            🔴 {player.faction.toUpperCase()}
          </span>
          <span className="hud__score">{t("common.pointsShort", { score: s?.player ?? 0 })}</span>
          <div className="hud__wins">
            {[0, 1].map((i) => (
              <RoundDot key={i} filled={player.roundWins > i} />
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="hud__center">
          <div className="hud__round">{t("game.round", { round })}</div>
          <div className="hud__log">
            {lastAction ? resolveLog(lastAction) : t("game.gameStarted")}
          </div>
          {isRoundOver && (
            <div className="hud__round-over">⚑ {t("game.roundOver")}</div>
          )}
        </div>

        {/* Opponent side */}
        <div className="hud__side hud__side--right">
          <span className="hud__faction hud__faction--opponent">
            🔵 {opponent.faction.toUpperCase()}
          </span>
          <span className="hud__score">{t("common.pointsShort", { score: s?.opponent ?? 0 })}</span>
          <div className="hud__wins">
            {[0, 1].map((i) => (
              <RoundDot key={i} filled={opponent.roundWins > i} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Player (bottom) ── */}
      <div className="half half--player">
        <PlayerBoard
          player={player}
          label={`🔴 ${t("player.you")}`}
          isActive={isPlayerTurn}
          score={s?.player ?? 0}
          rowOrder={["melee", "ranged", "siege"]}
          cardDefinitions={gameState.cardDefinitions}
          t={t}
        />
      </div>

      {/* ── Player Hand Area ── */}
      <div className="player-hand-area">
        {/* Status bar */}
        <div className="hand-status">
          {isRoundOver && (
            <span className="status-pill status-pill--gold">⚑ {t("game.roundOverStatus")}</span>
          )}
          {isPlayerTurn && !player.hasPassed && !isRoundOver && (
            <span className="status-pill status-pill--active">⚔️ {t("game.yourTurn")}</span>
          )}
          {player.hasPassed && !isRoundOver && (
            <span className="status-pill">⏳ {t("game.playerPassed")}</span>
          )}
          {!isPlayerTurn && !player.hasPassed && !isRoundOver && (
            <span className="status-pill">🔵 {t("game.opponentTurn")}</span>
          )}
        </div>

        {/* Hand cards */}
        <HandView
          cards={player.hand}
          cardDefinitions={gameState.cardDefinitions}
          canPlay={canPlay}
          onPlay={playCard}
          t={t}
        />

        {/* Pass button */}
        {canPlay && (
          <div className="hand-actions">
            <button
              id="btn-pass"
              className="btn btn--outline"
              onClick={pass}
            >
              ✋ {t("game.passRound")}
            </button>
          </div>
        )}
      </div>

      <aside className="game-sidebar">
        {/* Top: Card Preview or Glossary */}
        <div className="sidebar-preview-section">
          {hoveredCard ? (
            <div className={`sidebar-card-frame sidebar-card-frame--${hoveredCard.rarity} sidebar-card-frame--${hoveredCard.faction}`}>
              <div className="sidebar-card-header">
                <span className="sidebar-card-power">{hoveredCard.power}</span>
                <span className="sidebar-card-name">{getCardName(t, hoveredCard, hoveredCard.id)}</span>
              </div>
              <div className="sidebar-card-metadata">
                <span className={`sidebar-badge badge-faction badge-faction--${hoveredCard.faction}`}>
                  {t(`faction.${hoveredCard.faction}.name`)}
                </span>
                {hoveredCard.row && (
                  <span className="sidebar-badge badge-row">
                    {t(`row.${hoveredCard.row}`)}
                  </span>
                )}
                <span className={`sidebar-badge badge-rarity badge-rarity--${hoveredCard.rarity}`}>
                  {t(`rarity.${hoveredCard.rarity}`)}
                </span>
                <span className={`sidebar-badge badge-type badge-type--${hoveredCard.type}`}>
                  {t(`cardtype.${hoveredCard.type}`)}
                </span>
              </div>
              <div className="sidebar-card-body">
                <p className="sidebar-card-desc">{getCardDescription(t, hoveredCard)}</p>
              </div>
            </div>
          ) : (
            <div className="sidebar-glossary">
              <h3 className="glossary-title">{t("glossary.title")}</h3>
              <div className="glossary-list">
                {[
                  { key: "lock", icon: "🔐" },
                  { key: "revive", icon: "♻" },
                  { key: "summon", icon: "✨" },
                  { key: "special", icon: "📜" },
                  { key: "boost", icon: "⚡" },
                ].map(({ key, icon }) => (
                  <div key={key} className="glossary-item">
                    <span className="glossary-item__name">
                      {icon} {t(`glossary.${key}.name`)}
                    </span>
                    <p className="glossary-item__desc">{t(`glossary.${key}.desc`)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Action History */}
        <div className="sidebar-history-section">
          <ActionHistoryPanel gameState={gameState} t={t} />
        </div>
      </aside>

      {/* ── Round result overlay ── */}
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

  if (!gameState) return null;

  const winner = gameState.winnerId;
  const { player, opponent } = gameState.players;
  const winnerLabel =
    winner === "player"
      ? `🔴 ${t("result.winner", { faction: t(`faction.${player.faction}.name`) })}`
      : `🔵 ${t("result.winner", { faction: t(`faction.${opponent.faction}.name`) })}`;

  const passed = campaignMode ? levelPassed() : null;

  // Mark complete when entering result screen if campaign level is passed.
  if (campaignMode && passed && selectedLevel) {
    markComplete(selectedLevel.id);
  }

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

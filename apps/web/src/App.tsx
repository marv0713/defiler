import { useGameStore } from "./store/gameStore";
import { useSaveStore } from "./store/saveStore";
import { PlayerBoard } from "./components/PlayerBoard";
import { HandView } from "./components/HandView";
import { LevelSelectScreen } from "./components/LevelSelectScreen";
import { DeckBuilderScreen } from "./components/DeckBuilderScreen";
import type { Faction } from "@warring-states/game-core";

const FACTIONS: { value: Faction; label: string }[] = [
  { value: "qin", label: "🔴 Qin — 秦" },
  { value: "chu", label: "🔵 Chu — 楚" },
  { value: "qi",  label: "🟡 Qi — 齐" },
  { value: "zhao",label: "🟢 Zhao — 赵" },
];

function RoundDot({ filled }: { filled: boolean }) {
  return <span className={`round-dot${filled ? " round-dot--filled" : ""}`} />;
}

// ──────────────────────────────────────────
// Start Screen
// ──────────────────────────────────────────
function StartScreen() {
  const { startGame, playerFaction, opponentFaction, setPlayerFaction, setOpponentFaction, goToLevelSelect } =
    useGameStore();

  return (
    <div className="start-screen">
      <div className="start-card">
        <p className="eyebrow">战国 · Card Tactics</p>
        <h1>Warring States</h1>
        <p className="subtitle">
          Choose your faction and battle the AI across three rounds. Score the
          most points to conquer each round — win two to claim victory.
        </p>

        <div className="faction-pickers">
          <div className="faction-picker">
            <label htmlFor="picker-player">Your Faction</label>
            <select
              id="picker-player"
              value={playerFaction}
              onChange={(e) => setPlayerFaction(e.target.value as Faction)}
            >
              {FACTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="vs-badge">VS</div>

          <div className="faction-picker">
            <label htmlFor="picker-opponent">Opponent (AI)</label>
            <select
              id="picker-opponent"
              value={opponentFaction}
              onChange={(e) => setOpponentFaction(e.target.value as Faction)}
            >
              {FACTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
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
            ⚔ Quick Battle
          </button>
          <button
            id="btn-campaign"
            className="btn btn--outline btn--large"
            onClick={goToLevelSelect}
          >
            🗺 Campaign
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
  if (!gameState || gameState.status !== "round_finished") return null;

  const { roundWinnerId, currentRound, players } = gameState;
  const roundLabel = roundWinnerId
    ? roundWinnerId === "player"
      ? "🏆 You won the round!"
      : "💀 Opponent won the round."
    : "🤝 Round drawn — no wins awarded.";

  return (
    <div className="round-banner">
      <div className="round-banner__inner">
        <div className="round-banner__title">Round {currentRound} Over</div>
        <div className="round-banner__result">{roundLabel}</div>
        <div className="round-banner__wins">
          <span>🔴 {players.player.faction}: {players.player.roundWins} win{players.player.roundWins !== 1 ? "s" : ""}</span>
          <span>🔵 {players.opponent.faction}: {players.opponent.roundWins} win{players.opponent.roundWins !== 1 ? "s" : ""}</span>
        </div>
        <button
          id="btn-next-round"
          className="btn btn--primary"
          onClick={startNextRound}
        >
          ▶ Start Round {currentRound + 1}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Game Screen
// ──────────────────────────────────────────
function GameScreen() {
  const { gameState, lastAction, playCard, pass, scores } = useGameStore();

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
          label="🔵 Opponent"
          isActive={gameState.currentPlayerId === "opponent" && isPlaying}
          score={s?.opponent ?? 0}
          rowOrder={["melee", "ranged", "siege"]}
          cardDefinitions={gameState.cardDefinitions}
        />
      </div>

      {/* ── HUD (middle) ── */}
      <div className="hud">
        {/* Player side */}
        <div className="hud__side">
          <span className="hud__faction hud__faction--player">
            🔴 {player.faction.toUpperCase()}
          </span>
          <span className="hud__score">{s?.player ?? 0}pt</span>
          <div className="hud__wins">
            {[0, 1].map((i) => (
              <RoundDot key={i} filled={player.roundWins > i} />
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="hud__center">
          <div className="hud__round">Round {round} / 3</div>
          <div className="hud__log">{lastAction ?? "Game started"}</div>
          {isRoundOver && (
            <div className="hud__round-over">⚑ Round Over</div>
          )}
        </div>

        {/* Opponent side */}
        <div className="hud__side hud__side--right">
          <span className="hud__faction hud__faction--opponent">
            🔵 {opponent.faction.toUpperCase()}
          </span>
          <span className="hud__score">{s?.opponent ?? 0}pt</span>
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
          label="🔴 You"
          isActive={isPlayerTurn}
          score={s?.player ?? 0}
          rowOrder={["siege", "ranged", "melee"]}
          cardDefinitions={gameState.cardDefinitions}
        />
      </div>

      {/* ── Player Hand Area ── */}
      <div className="player-hand-area">
        {/* Status bar */}
        <div className="hand-status">
          {isRoundOver && (
            <span className="status-pill status-pill--gold">⚑ Round Over — see result below</span>
          )}
          {isPlayerTurn && !player.hasPassed && !isRoundOver && (
            <span className="status-pill status-pill--active">⚔️ Your turn — choose a card or pass</span>
          )}
          {player.hasPassed && !isRoundOver && (
            <span className="status-pill">⏳ You passed — waiting for opponent…</span>
          )}
          {!isPlayerTurn && !player.hasPassed && !isRoundOver && (
            <span className="status-pill">🔵 Opponent's turn…</span>
          )}
        </div>

        {/* Hand cards */}
        <HandView
          cards={player.hand}
          cardDefinitions={gameState.cardDefinitions}
          canPlay={canPlay}
          onPlay={playCard}
        />

        {/* Pass button */}
        {canPlay && (
          <div className="hand-actions">
            <button
              id="btn-pass"
              className="btn btn--outline"
              onClick={pass}
            >
              ✋ Pass Round
            </button>
          </div>
        )}
      </div>

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

  if (!gameState) return null;

  const winner = gameState.winnerId;
  const { player, opponent } = gameState.players;
  const winnerLabel =
    winner === "player"
      ? `🔴 ${player.faction.toUpperCase()} WINS!`
      : `🔵 ${opponent.faction.toUpperCase()} WINS!`;

  const passed = campaignMode ? levelPassed() : null;

  // Mark complete when entering result screen if campaign level is passed.
  if (campaignMode && passed && selectedLevel) {
    markComplete(selectedLevel.id);
  }

  return (
    <div className="result-screen">
      <div className="result-card">
        <p className="eyebrow">Battle Concluded</p>
        <h1 className={`result-winner ${winner === "player" ? "result-winner--player" : "result-winner--opponent"}`}>
          {winnerLabel}
        </h1>

        {/* Campaign pass/fail banner */}
        {campaignMode && (
          <div className={`campaign-result-banner ${passed ? "campaign-result-banner--pass" : "campaign-result-banner--fail"}`}>
            {passed ? "✅ Level Complete!" : "❌ Conditions not met — try again"}
          </div>
        )}

        <div className="result-stats">
          <div className="result-stat">
            <span className="result-stat__label">🔴 {player.faction}</span>
            <span className="result-stat__value">{player.roundWins} round win{player.roundWins !== 1 ? "s" : ""}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">🔵 {opponent.faction}</span>
            <span className="result-stat__value">{opponent.roundWins} round win{opponent.roundWins !== 1 ? "s" : ""}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">Rounds played</span>
            <span className="result-stat__value">{gameState.currentRound}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">Total actions</span>
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
                ← Back to Levels
              </button>
              {passed && (
                <button
                  id="btn-next-level"
                  className="btn btn--primary btn--large"
                  onClick={goToLevelSelect}
                >
                  Next Level →
                </button>
              )}
            </>
          ) : (
            <button
              id="btn-restart"
              className="btn btn--primary btn--large"
              onClick={restart}
            >
              ↩ New Battle
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

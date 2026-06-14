import { useEffect, useRef } from "react";
import { useGameStore } from "./store/gameStore";
import { PlayerBoard } from "./components/PlayerBoard";
import type { Faction } from "@warring-states/game-core";

const FACTIONS: { value: Faction; label: string; color: string }[] = [
  { value: "qin", label: "🔴 Qin", color: "#8b1a1a" },
  { value: "chu", label: "🔵 Chu", color: "#1a3a6b" },
  { value: "qi", label: "🟡 Qi", color: "#7a6010" },
  { value: "zhao", label: "🟢 Zhao", color: "#1a5c2e" },
];

function RoundDot({ filled }: { filled: boolean }) {
  return <span className={`round-dot${filled ? " round-dot--filled" : ""}`} />;
}

// ──────────────────────────────────────────
// Start Screen
// ──────────────────────────────────────────
function StartScreen() {
  const { startGame, playerFaction, opponentFaction, setPlayerFaction, setOpponentFaction } = useGameStore();

  return (
    <div className="start-screen">
      <div className="start-card">
        <p className="eyebrow">战国 · Card Tactics</p>
        <h1>Warring States</h1>
        <p className="subtitle">Two AI generals will battle across three rounds. Choose their factions and watch the war unfold.</p>

        <div className="faction-pickers">
          <div className="faction-picker">
            <label htmlFor="picker-player">🔴 Player (bottom)</label>
            <select
              id="picker-player"
              value={playerFaction}
              onChange={(e) => setPlayerFaction(e.target.value as Faction)}
            >
              {FACTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="vs-badge">VS</div>

          <div className="faction-picker">
            <label htmlFor="picker-opponent">🔵 Opponent (top)</label>
            <select
              id="picker-opponent"
              value={opponentFaction}
              onChange={(e) => setOpponentFaction(e.target.value as Faction)}
            >
              {FACTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          id="btn-start"
          className="btn btn--primary btn--large"
          onClick={() => startGame(playerFaction, opponentFaction)}
        >
          Begin Battle ⚔️
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Game Screen
// ──────────────────────────────────────────
function GameScreen() {
  const { gameState, lastAction, autoplay, tick, toggleAutoplay, scores } =
    useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Autoplay timer
  useEffect(() => {
    if (autoplay) {
      intervalRef.current = setInterval(tick, 600);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoplay, tick]);

  if (!gameState) return null;

  const s = scores();
  const { player, opponent } = gameState.players;
  const round = gameState.currentRound;
  const isRoundOver = gameState.status === "round_finished";

  return (
    <div className="game-screen">
      {/* Opponent (top) — rows in natural order: melee → ranged → siege */}
      <div className="half half--opponent">
        <PlayerBoard
          player={opponent}
          label="🔵 Opponent"
          isActive={gameState.currentPlayerId === "opponent"}
          score={s?.opponent ?? 0}
          rowOrder={["melee", "ranged", "siege"]}
        />
      </div>

      {/* Middle HUD */}
      <div className="hud">
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

        <div className="hud__center">
          <div className="hud__round">Round {round}</div>
          <div className="hud__log">{lastAction ?? "Game started"}</div>
          {isRoundOver && (
            <div className="hud__round-over">⚑ Round Over — advancing…</div>
          )}
          <div className="hud__controls">
            <button
              id="btn-next"
              className="btn btn--primary"
              onClick={tick}
              disabled={autoplay}
            >
              ▶ Next Step
            </button>
            <button
              id="btn-autoplay"
              className={`btn btn--outline${autoplay ? " btn--active" : ""}`}
              onClick={toggleAutoplay}
            >
              {autoplay ? "⏸ Pause" : "⏩ Auto"}
            </button>
          </div>
        </div>

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

      {/* Player (bottom) — rows mirrored: siege → ranged → melee */}
      <div className="half half--player">
        <PlayerBoard
          player={player}
          label="🔴 Player"
          isActive={gameState.currentPlayerId === "player"}
          score={s?.player ?? 0}
          rowOrder={["siege", "ranged", "melee"]}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Result Screen
// ──────────────────────────────────────────
function ResultScreen() {
  const { gameState, restart } = useGameStore();
  if (!gameState) return null;

  const winner = gameState.winnerId;
  const { player, opponent } = gameState.players;
  const winnerFaction =
    winner === "player" ? player.faction : opponent.faction;

  return (
    <div className="result-screen">
      <div className="result-card">
        <p className="eyebrow">Battle Concluded</p>
        <h1 className="result-winner">
          {winner === "player" ? "🔴" : "🔵"}{" "}
          {winnerFaction.toUpperCase()} WINS
        </h1>

        <div className="result-stats">
          <div className="result-stat">
            <span className="result-stat__label">🔴 {player.faction}</span>
            <span className="result-stat__value">{player.roundWins} round wins</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">🔵 {opponent.faction}</span>
            <span className="result-stat__value">{opponent.roundWins} round wins</span>
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

        <button id="btn-restart" className="btn btn--primary btn--large" onClick={restart}>
          ↩ New Battle
        </button>
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
      {screen === "start" && <StartScreen />}
      {screen === "game" && <GameScreen />}
      {screen === "result" && <ResultScreen />}
    </div>
  );
}

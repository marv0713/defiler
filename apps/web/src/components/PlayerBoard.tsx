import type { PlayerState, Row } from "@warring-states/game-core";
import { CardView } from "./CardView";

interface PlayerBoardProps {
  player: PlayerState;
  label: string;
  isActive: boolean;
  score: number;
  rowOrder?: Row[];
}

const ROW_LABELS: Record<Row, string> = {
  melee: "⚔️ Melee",
  ranged: "🏹 Ranged",
  siege: "💣 Siege",
};

export function PlayerBoard({
  player,
  label,
  isActive,
  score,
  rowOrder = ["melee", "ranged", "siege"],
}: PlayerBoardProps) {
  return (
    <div className={`player-board${isActive ? " player-board--active" : ""}`}>
      {/* Header */}
      <div className="player-board__header">
        <span className="player-board__label">
          {isActive && <span className="turn-dot" />}
          {label}
          <span className="faction-tag">[{player.faction}]</span>
        </span>
        <span className="player-board__meta">
          <span className="meta-badge score-badge">{score}pt</span>
          <span className="meta-badge">Hand: {player.hand.length}</span>
          <span className="meta-badge">Deck: {player.deck.length}</span>
          {player.hasPassed && <span className="meta-badge passed-badge">PASSED</span>}
        </span>
      </div>

      {/* Rows */}
      <div className="rows">
        {rowOrder.map((row) => {
          const liveCards = player.board[row].filter((c) => !c.isDestroyed);
          const rowScore = liveCards.reduce((sum, c) => sum + c.currentPower, 0);
          return (
            <div key={row} className="board-row">
              <span className="board-row__label">{ROW_LABELS[row]}</span>
              <div className="board-row__cards">
                {liveCards.map((card) => (
                  <CardView key={card.instanceId} card={card} />
                ))}
                {liveCards.length === 0 && (
                  <span className="board-row__empty">—</span>
                )}
              </div>
              <span className="board-row__score">{rowScore}</span>
            </div>
          );
        })}
      </div>

      {/* Graveyard strip */}
      {player.graveyard.length > 0 && (
        <div className="graveyard-strip">
          <span className="graveyard-strip__label">
            🪦 {player.graveyard.length}
          </span>
          <div className="graveyard-strip__cards">
            {player.graveyard.slice(-5).map((c) => (
              <CardView key={c.instanceId} card={c} ghost />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

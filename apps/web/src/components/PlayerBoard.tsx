import type { CardDefinition, PlayerState, Row } from "@warring-states/game-core";
import { CardView } from "./CardView";

interface PlayerBoardProps {
  player: PlayerState;
  label: string;
  isActive: boolean;
  score: number;
  rowOrder?: Row[];
  cardDefinitions?: Record<string, CardDefinition>;
  t?: (id: string, params?: Record<string, string | number>) => string;
  hideHeader?: boolean;
  highlightedRow?: Row | 'all' | null;
  onRowClick?: (row: Row) => void;
}

const ROW_LABELS: Record<Row, string> = {
  melee: "melee",
  ranged: "ranged",
  siege: "siege",
};

export function PlayerBoard({
  player,
  label,
  isActive,
  score,
  rowOrder = ["melee", "ranged", "siege"],
  cardDefinitions = {},
  t,
  hideHeader = false,
  highlightedRow = null,
  onRowClick,
}: PlayerBoardProps) {
  const translate = t ?? ((id: string, params?: Record<string, string | number>) => {
    if (id === "common.pointsShort") return `${params?.score ?? 0}pt`;
    if (id === "board.hand") return `Hand: ${params?.count ?? 0}`;
    if (id === "board.deck") return `Deck: ${params?.count ?? 0}`;
    if (id === "board.passed") return "PASSED";
    if (id.startsWith("row.")) return id.slice(4);
    return id;
  });
  return (
    <div className={`player-board${isActive ? " player-board--active" : ""}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="player-board__header">
          <span className="player-board__label">
            {isActive && <span className="turn-dot" />}
            {label}
            <span className="faction-tag">[{player.faction}]</span>
          </span>
          <span className="player-board__meta">
            <span className="meta-badge score-badge">{translate("common.pointsShort", { score })}</span>
            <span className="meta-badge">{translate("board.hand", { count: player.hand.length })}</span>
            <span className="meta-badge">{translate("board.deck", { count: player.deck.length })}</span>
            {player.hasPassed && <span className="meta-badge passed-badge">{translate("board.passed")}</span>}
          </span>
        </div>
      )}

      {/* Rows */}
      <div className="rows">
        {rowOrder.map((row) => {
          const liveCards = player.board[row].filter((c) => !c.isDestroyed);
          const rowScore = liveCards.reduce((sum, c) => sum + c.currentPower, 0);
          const isHighlighted = highlightedRow === "all" || highlightedRow === row;
          return (
            <div
              key={row}
              className={`board-row ${isHighlighted ? "board-row--highlighted" : ""} ${highlightedRow && !isHighlighted ? "board-row--dimmed" : ""}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              <span className="board-row__label">{translate(`row.${ROW_LABELS[row]}`)}</span>
              <div className="board-row__cards">
                {liveCards.map((card) => (
                  <CardView
                    key={card.instanceId}
                    card={card}
                    definition={cardDefinitions[card.cardId]}
                    t={t}
                  />
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
              <CardView
                key={c.instanceId}
                card={c}
                definition={cardDefinitions[c.cardId]}
                ghost
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

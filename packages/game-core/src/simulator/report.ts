import type { CardSimulationStats, SimulationReport } from "./simulateMatchup";

function formatFaction(faction: string): string {
  return faction.charAt(0).toUpperCase() + faction.slice(1);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function getTopPlayedCards(
  cardStats: Record<string, CardSimulationStats>,
): CardSimulationStats[] {
  return Object.values(cardStats)
    .filter((stat) => stat.timesPlayed > 0)
    .sort((left, right) => {
      if (right.timesPlayed !== left.timesPlayed) {
        return right.timesPlayed - left.timesPlayed;
      }
      return right.winRateWhenPlayed - left.winRateWhenPlayed;
    })
    .slice(0, 10);
}

export function formatSimulationReport(report: SimulationReport): string {
  const factionA = formatFaction(report.factionA);
  const factionB = formatFaction(report.factionB);
  const lines = [
    `${factionA} vs ${factionB}`,
    `Games: ${report.games}`,
    `Completed: ${report.completedGames}`,
    `Stopped by max turns: ${report.stoppedByMaxTurns}`,
    `${factionA} win rate: ${formatPercent(report.factionAWinRate)} (${report.factionAWins})`,
    `${factionB} win rate: ${formatPercent(report.factionBWinRate)} (${report.factionBWins})`,
    `Draw rate: ${formatPercent(report.drawRate)} (${report.draws})`,
    `Average rounds: ${formatNumber(report.averageRounds)}`,
    `Average turns: ${formatNumber(report.averageTurns)}`,
    `Average final scores: ${factionA} ${formatNumber(report.averageFinalScores.factionA)} / ${factionB} ${formatNumber(report.averageFinalScores.factionB)}`,
    "",
    "Top played cards:",
  ];

  const topCards = getTopPlayedCards(report.cardStats);
  if (topCards.length === 0) {
    lines.push("- None");
  } else {
    for (const card of topCards) {
      lines.push(
        `- ${card.englishName}: drawn ${card.timesDrawn}, played ${card.timesPlayed}, win rate when played ${formatPercent(card.winRateWhenPlayed)}, avg contribution ${formatNumber(card.averageContribution)}`,
      );
    }
  }

  return lines.join("\n");
}

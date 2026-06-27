import type { MessageDictionary } from "./types";

// ---------------------------------------------------------------------------
// Card translations — English (en)
// ---------------------------------------------------------------------------

const enCardMessages: MessageDictionary = {
  // ── QIN ───────────────────────────────────────────────────────────────────

  "card.qin-infantry.name": "Qin Infantry",
  "card.qin-infantry.description": "A dependable Qin melee unit with straightforward power.",

  "card.qin-veteran.name": "Qin Veteran",
  "card.qin-veteran.description": "A hardened Qin front-line unit built for steady pressure.",

  "card.iron-eagle-soldier.name": "Iron Eagle Soldier",
  "card.iron-eagle-soldier.description": "An elite Qin attacker with high standalone strength.",

  "card.legalist-officer.name": "Legalist Officer",
  "card.legalist-officer.description": "On play: boost the allied unit with the lowest power by 3.",

  "card.qin-crossbow-formation.name": "Qin Crossbow Formation",
  "card.qin-crossbow-formation.description": "On play: deal 2 damage to a random enemy unit twice.",

  "card.qin-spear-guard.name": "Qin Spear Guard",
  "card.qin-spear-guard.description": "A reliable Qin spearman holding the front line.",

  "card.qin-siege-engineer.name": "Qin Siege Engineer",
  "card.qin-siege-engineer.description": "A Qin engineering specialist operating heavy siege weapons.",

  "card.qin-war-chariot.name": "Qin War Chariot",
  "card.qin-war-chariot.description": "On play: deal 2 damage to the enemy unit with the lowest power.",

  "card.qin-arbalest.name": "Qin Arbalest",
  "card.qin-arbalest.description": "On play: deal 3 damage to the enemy unit with the highest power.",

  "card.shang-yang.name": "Shang Yang",
  "card.shang-yang.description": "On play: boost all allied melee units by 2. The architect of Qin's power.",

  "card.bai-qi.name": "Bai Qi",
  "card.bai-qi.description": "On play: destroy the enemy unit with the lowest power. The God of Slaughter.",

  "card.wang-jian.name": "Wang Jian",
  "card.wang-jian.description": "On play: if you are ahead on points, gain 3 power. A general who fights from strength.",

  "card.qin-cavalry-charge.name": "Qin Cavalry Charge",
  "card.qin-cavalry-charge.description": "Deal 2 damage to a random enemy unit twice.",

  "card.qin-conscription.name": "Qin Conscription",
  "card.qin-conscription.description": "Summon two Qin Conscripts to the melee row.",

  "card.qin-token.name": "Qin Conscript",
  "card.qin-token.description": "A summoned Qin conscript. Weak alone, dangerous in numbers.",

  // ── CHU ───────────────────────────────────────────────────────────────────

  "card.chu-spearman.name": "Chu Spearman",
  "card.chu-spearman.description": "A modest Chu melee unit that supports swarm strategies.",

  "card.chu-archer.name": "Chu Archer",
  "card.chu-archer.description": "A basic Chu ranged unit for building board presence.",

  "card.chu-shaman.name": "Chu Shaman",
  "card.chu-shaman.description": "On play: summon one Chu Warrior to the melee row.",

  "card.chunshen-retainer.name": "Lord Chunshen's Retainer",
  "card.chunshen-retainer.description": "On play: boost 2 random allied units by 1.",

  "card.xiang-yan.name": "Xiang Yan",
  "card.xiang-yan.description": "On play: if you control 4 or more units, gain 3 power. Strength in numbers.",

  "card.chu-footsoldier.name": "Chu Footsoldier",
  "card.chu-footsoldier.description": "A basic Chu frontline soldier, one of many.",

  "card.chu-shield-bearer.name": "Chu Shield Bearer",
  "card.chu-shield-bearer.description": "A Chu soldier with a heavy shield, holding the melee line.",

  "card.chu-river-guard.name": "Chu River Guard",
  "card.chu-river-guard.description": "A Chu defender positioned at river crossings.",

  "card.chu-war-dancer.name": "Chu War Dancer",
  "card.chu-war-dancer.description": "On play: boost the allied unit with the lowest power by 3.",

  "card.chu-herald.name": "Chu Herald",
  "card.chu-herald.description": "On play: summon one Chu Warrior, then boost the weakest ally by 1.",

  "card.lord-chunshen.name": "Lord Chunshen",
  "card.lord-chunshen.description": "On play: boost all allied melee units by 1. One of the Four Lords of the Warring States.",

  "card.king-of-chu.name": "King of Chu",
  "card.king-of-chu.description": "On play: if you control 6 or more units, gain 4 power. The might of Chu unleashed.",

  "card.chu-battle-cry.name": "Chu Battle Cry",
  "card.chu-battle-cry.description": "Summon two Chu Warriors, then boost the weakest ally by 1.",

  "card.chu-flood-tactic.name": "Chu Flood Tactic",
  "card.chu-flood-tactic.description": "Boost all allied ranged units by 2.",

  "card.chu-token.name": "Chu Warrior",
  "card.chu-token.description": "A summoned Chu warrior. Small alone, overwhelming in a swarm.",

  // ── QI ────────────────────────────────────────────────────────────────────

  "card.qi-warrior.name": "Qi Warrior",
  "card.qi-warrior.description": "A sturdy Qi melee unit with solid baseline power.",

  "card.jixia-scholar.name": "Jixia Scholar",
  "card.jixia-scholar.description": "On play: draw 1 card, then discard 1. Filter your hand for better options.",

  "card.guan-zhong-legacy.name": "Guan Zhong's Legacy",
  "card.guan-zhong-legacy.description": "Draw 2 cards, then discard 1. The wisdom of Qi's greatest statesman.",

  "card.sun-bin.name": "Sun Bin",
  "card.sun-bin.description": "On play: deal 3 damage to the enemy unit with the highest power. A master of disruption.",

  "card.tian-ji.name": "Tian Ji",
  "card.tian-ji.description": "On play: draw 1 card, then discard 1. Renowned for strategic flexibility.",

  "card.qi-spearman.name": "Qi Spearman",
  "card.qi-spearman.description": "A dependable Qi front-line spearman.",

  "card.qi-crossbowman.name": "Qi Crossbowman",
  "card.qi-crossbowman.description": "A skilled Qi ranged unit with a powerful crossbow.",

  "card.qi-siege-crew.name": "Qi Siege Crew",
  "card.qi-siege-crew.description": "A Qi crew operating siege equipment at a distance.",

  "card.jixia-strategist.name": "Jixia Strategist",
  "card.jixia-strategist.description": "On play: draw 2 cards, then discard 1. A senior Jixia Academy thinker.",

  "card.qi-scout.name": "Qi Scout",
  "card.qi-scout.description": "On play: draw 1, discard 1, and deal 1 damage to a random enemy.",

  "card.tian-dan.name": "Tian Dan",
  "card.tian-dan.description": "On play: deal 3 damage to the enemy's strongest unit, then gain 1 power. Defender of Qi.",

  "card.sun-tzu.name": "Sun Tzu",
  "card.sun-tzu.description": "On play: draw 2 cards discard 1, then deal 3 damage to the strongest enemy. The Art of War personified.",

  "card.guan-zhong.name": "Guan Zhong",
  "card.guan-zhong.description": "On play: boost the weakest ally by 2, then draw 1 and discard 1. Qi's greatest prime minister.",

  "card.qi-iron-cavalry.name": "Qi Iron Cavalry",
  "card.qi-iron-cavalry.description": "On play: deal 2 damage to the enemy unit with the lowest power.",

  "card.plan-of-jixia.name": "Plan of Jixia",
  "card.plan-of-jixia.description": "Draw 3 cards, then discard 2. Refresh your hand with Jixia precision.",

  // ── ZHAO ──────────────────────────────────────────────────────────────────

  "card.zhao-border-cavalry.name": "Zhao Border Cavalry",
  "card.zhao-border-cavalry.description": "A mobile Zhao cavalry unit with reliable melee strength.",

  "card.hu-clothing-cavalry.name": "Hu Clothing Cavalry",
  "card.hu-clothing-cavalry.description": "Boost all allied melee units by 1. The cavalry reform that made Zhao feared.",

  "card.li-mu.name": "Li Mu",
  "card.li-mu.description": "On play: if you are losing on points, gain 3 power. Zhao's greatest defender.",

  "card.lian-po.name": "Lian Po",
  "card.lian-po.description": "On play: if your opponent has passed this round, gain 2 power. A general who punishes hesitation.",

  "card.zhao-raid.name": "Zhao Raid",
  "card.zhao-raid.description": "Deal 2 damage to a random enemy unit twice. Swift and brutal.",

  "card.zhao-footsoldier.name": "Zhao Footsoldier",
  "card.zhao-footsoldier.description": "A sturdy Zhao foot soldier trained for the northern frontier.",

  "card.zhao-archer.name": "Zhao Archer",
  "card.zhao-archer.description": "A Zhao ranged unit skilled with the composite bow.",

  "card.zhao-siege-crew.name": "Zhao Siege Crew",
  "card.zhao-siege-crew.description": "A Zhao crew managing catapults at the rear.",

  "card.zhao-heavy-cavalry.name": "Zhao Heavy Cavalry",
  "card.zhao-heavy-cavalry.description": "On play: if you are losing on points, gain 2 power. Zhao cavalry at its fiercest when cornered.",

  "card.zhao-vanguard.name": "Zhao Vanguard",
  "card.zhao-vanguard.description": "On play: boost the allied unit with the lowest power by 3.",

  "card.zhao-warlord.name": "Zhao Warlord",
  "card.zhao-warlord.description": "On play: lock the enemy unit with the highest power, disabling its skill.",

  "card.lin-xiangru.name": "Lin Xiangru",
  "card.lin-xiangru.description": "On play: if you are losing on points, gain 4 power. Zhao's defiant voice at the court of Qin.",

  "card.zhao-she.name": "Zhao She",
  "card.zhao-she.description": "On play: deal 3 damage to the enemy unit with the lowest power. Father of the warrior poet.",

  "card.king-of-zhao.name": "King of Zhao",
  "card.king-of-zhao.description": "On play: if losing, gain 3 power; then boost the weakest ally by 2. Zhao's last hope.",

  "card.zhao-ambush.name": "Zhao Ambush",
  "card.zhao-ambush.description": "Deal 2 damage to a random enemy, then lock the enemy's strongest unit.",

  // ── NEUTRAL ───────────────────────────────────────────────────────────────

  "card.scouts-report.name": "Scout's Report",
  "card.scouts-report.description": "Draw 1 card from your deck.",

  "card.supply-wagon.name": "Supply Wagon",
  "card.supply-wagon.description": "A 4-power siege unit that buffs all allied siege units by 1.",

  "card.forced-march.name": "Forced March",
  "card.forced-march.description": "Buff your weakest unit by 3.",

  "card.feigned-retreat.name": "Feigned Retreat",
  "card.feigned-retreat.description": "Deal 3 damage to the strongest enemy unit.",

  "card.wandering-swordsman.name": "Wandering Swordsman",
  "card.wandering-swordsman.description": "A 7-power melee hero who buffs himself by 2 when played — effectively 9 power.",

  "card.sun-tzu-art-of-war.name": "Art of War",
  "card.sun-tzu-art-of-war.description": "Draw 1 card, then buff your strongest unit by 4. The ultimate tactical tome.",
};

export const enMessages: MessageDictionary = {
  ...enCardMessages,
  "app.eyebrow": "Warring States · Card Tactics",
  "app.title": "Warring States",
  "start.subtitle": "Choose your faction and battle the AI across three rounds. Score the most points to conquer each round — win two to claim victory.",
  "start.yourFaction": "Your Faction",
  "start.opponentFaction": "Opponent (AI)",
  "start.quickBattle": "Quick Battle",
  "start.campaign": "Campaign",
  "common.vs": "VS",
  "common.language": "Language",
  "common.english": "English",
  "common.chinese": "中文",
  "common.pointsShort": "{score}pt",
  "common.roundWins": "{count} round win{suffix}",
  "player.you": "You",
  "player.opponent": "Opponent",
  "board.hand": "Hand: {count}",
  "board.deck": "Deck: {count}",
  "board.passed": "PASSED",
  "row.melee": "Melee",
  "row.ranged": "Ranged",
  "row.siege": "Siege",
  "hand.empty": "— no cards in hand —",
  "hand.playCardLabel": "Play {card}, power {power}{rowText}",
  "hand.rowText": ", row: {row}",
  "game.round": "Round {round} / 3",
  "game.roundOver": "Round Over",
  "game.gameStarted": "Game started",
  "game.yourTurn": "Your turn — play a card or pass.",

  "game.opponentTurn": "Opponent's turn…",
  "game.playerPassed": "You passed — waiting for opponent…",
  "game.roundOverStatus": "Round Over — see result below",
  "game.passRound": "Pass Round",
  "round.title": "Round {round} Over",
  "round.playerWon": "You won the round!",
  "round.opponentWon": "Opponent won the round.",
  "round.draw": "Round drawn — no wins awarded.",
  "round.startNext": "Start Round {round}",
  "result.battleConcluded": "Battle Concluded",
  "result.winner": "{faction} WINS!",
  "result.levelComplete": "Level Complete!",
  "result.levelFailed": "Conditions not met — try again",
  "result.roundsPlayed": "Rounds played",
  "result.totalActions": "Total actions",
  "result.backToLevels": "Back to Levels",
  "result.nextLevel": "Next Level",
  "result.newBattle": "New Battle",
  "faction.qin.name": "Qin",
  "faction.chu.name": "Chu",
  "faction.qi.name": "Qi",
  "faction.zhao.name": "Zhao",
  "faction.qin.trait": "High power, direct damage, and clean removal. Qin wins by applying pressure and forcing inefficient answers.",
  "faction.chu.trait": "Board swarm, summons, and row-wide buffs. Chu wins by filling the field and turning many small units into a wave.",
  "faction.qi.trait": "Card flow, hand advantage, and precision damage. Qi wins by finding more options and controlling key threats.",
  "faction.zhao.trait": "Comeback boosts, locks, and cavalry bursts. Zhao wins by conserving resources, then reversing the board at the right moment.",
  "debug.missingInZh": "Debug fallback",

  // ── Level Select Screen ───────────────────────────────────────────────────
  "levelselect.back": "Back",
  "levelselect.title": "Campaign",
  "levelselect.subtitle": "Build one 25-card campaign deck and carry it through all six challenges.",
  "levelselect.vs": "vs",
  "levelselect.campaignFaction": "Campaign faction",
  "levelselect.chooseFactionFirst": "Choose a campaign faction first. This campaign run will lock that faction and reuse one deck.",

  // ── Game Log Messages ───────────────────────────────────────────────────
  "game.roundStarted": "⚔️ Round started — your turn!",
  "game.youPlay": "🔴 You play {name}",
  "game.youPlayWithFx": "🔴 You play {name} [⚡ {fx}]",
  "game.youPass": "🔴 You pass",
  "game.opponentPlay": "🔵 Opponent plays {name}",
  "game.opponentPlayWithFx": "🔵 Opponent plays {name} [⚡ {fx}]",
  "game.opponentPass": "🔵 Opponent passes",
  "history.title": "History",
  "history.empty": "No actions yet.",
  "history.round": "R{round}",
  "history.player": "You",
  "history.opponent": "Opponent",
  "history.play": "{actor} played {card}",
  "history.pass": "{actor} passed",
  "history.nextRound": "Next round started",

  // ── Deck Builder Screen ───────────────────────────────────────────────────
  "deckbuilder.backToLevels": "Back to Levels",
  "deckbuilder.chooseFaction": "Choose Faction",
  "deckbuilder.lockedFaction": "Locked faction",
  "deckbuilder.lockedFactionHint": "Deck can use this faction plus neutral cards.",
  "deckbuilder.cardPool": "Card Pool",
  "deckbuilder.yourDeck": "Your Deck",
  "deckbuilder.emptyHint": "Click cards to add them.",
  "deckbuilder.removeCard": "Remove",
  "deckbuilder.startBattle": "Start Battle",
  "deckbuilder.autoFill": "Auto Fill",
  "deckbuilder.cards": "cards",
  "deckbuilder.tooltipPower": "power",
  "deckbuilder.noDuplicates": "No duplicates",
  "deckbuilder.needsFaction": "Needs ≥1 {faction}",
  "deckbuilder.minFactions": "≥{count} factions",
  "deckbuilder.mustWinRound2": "Must win Round 2",
  "deckbuilder.cardPreview": "Card Details",
  "deckbuilder.previewPlaceholder": "Hover over a card in the pool or your deck to view details.",
  "deckbuilder.rarity": "Rarity",
  "deckbuilder.type": "Type",
  "deckbuilder.row": "Row",
  "deckbuilder.faction": "Faction",
  "deckbuilder.artPlaceholder": "Art Placeholder",
  "rarity.common": "Common",
  "rarity.elite": "Elite",
  "rarity.hero": "Hero",
  "rarity.legend": "Legend",
  "cardtype.unit": "Unit",
  "cardtype.special": "Special",

  // ── Campaign Level Text ───────────────────────────────────────────────────
  "level.level-1-iron-wall.subtitle": "Face the relentless Qin war machine — raw power, no tricks.",
  "level.level-1-iron-wall.hint": "Out-tempo the opponent: play strong cards early and pass before they do.",
  "level.level-2-swarm.subtitle": "Chu tokens flood the board — bring high-power answers.",
  "level.level-2-swarm.hint": "Use your faction's strongest answers and neutral tactics to break through the token flood.",
  "level.level-3-scholar.subtitle": "Qi masters hand advantage — manage your limited copies carefully.",
  "level.level-3-scholar.hint": "Use faction cards and neutral tactics together. High-rarity cards have strict copy limits.",
  "level.level-4-comeback.subtitle": "Zhao saves its burst for rounds 2 and 3 — you must win round 2.",
  "level.level-4-comeback.hint": "The opponent will concede round 1. Conserve your best cards for round 2 — you must win it.",
  "level.level-5-coalition.subtitle": "Elite warriors from all four states — no single weakness to exploit.",
  "level.level-5-coalition.hint": "Expect varied threats. Tune your single-faction deck with neutral cards before entering.",
  "level.level-6-apex.subtitle": "The full Qin arsenal at peak efficiency — no restrictions, no mercy.",
  "level.level-6-apex.hint": "No restrictions. Study the previous levels and build the deck you trust most.",

  // ── Glossary Text ─────────────────────────────────────────────────────────
  "glossary.title": "Mechanics Glossary",
  "glossary.lock.name": "Lock (封锁)",
  "glossary.lock.desc": "Disables a unit card's active effects and skills.",
  "glossary.revive.name": "Revive (复活)",
  "glossary.revive.desc": "Play a unit card from the graveyard back to the battlefield.",
  "glossary.special.name": "Special (计策)",
  "glossary.special.desc": "A card with 0 power that triggers an effect, then goes to the graveyard.",
  "glossary.summon.name": "Summon (召唤)",
  "glossary.summon.desc": "Spawns additional token units onto the board.",
  "glossary.boost.name": "Conditional Boost (条件强化)",
  "glossary.boost.desc": "Gains extra power if specific conditions (e.g. score behind, opponent passed) are met.",
  "glossary.power.name": "Power (战力)",
  "glossary.power.desc": "The points a card contributes to the row. Highest total score wins.",
};

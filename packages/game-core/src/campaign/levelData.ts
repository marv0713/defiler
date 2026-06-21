import type { LevelDefinition } from "./levelTypes";

/**
 * All 6 campaign levels, ordered from easiest to hardest.
 *
 * Opponent deck design notes
 * ──────────────────────────
 * Level 1 — 铁壁 Iron Wall
 *   Pure Qin power cards, zero effect cards. Lets the player learn Pass timing
 *   without worrying about skill interactions.
 *
 * Level 2 — 蜂涌 The Swarm
 *   Chu token flood. Opponent can spike the board count quickly via SUMMON.
 *   Player constraint: ≥3 Qin cards (pushes toward high-power answers).
 *
 * Level 3 — 谋算 The Scholar
 *   Qi hand-control. Opponent generates card advantage with DRAW_DISCARD.
 *   Player constraint: no duplicates (forces a curated 25-card unique build).
 *
 * Level 4 — 逆转 The Comeback
 *   Zhao burst. Opponent is stacked with CONDITIONAL_BOOST and deliberately
 *   concedes round 1, then explodes in round 2–3.
 *   Win condition: player must also win round 2 to prove comeback awareness.
 *
 * Level 5 — 合纵 Coalition
 *   Mixed elite units from all four factions. No obvious hole to exploit.
 *   Player constraint: deck must span ≥2 factions.
 *
 * Level 6 — 王道 Apex
 *   Strongest Qin selection. Normal AI at its best.
 *   No player constraint; full 60-card pool available.
 */
export const CAMPAIGN_LEVELS: LevelDefinition[] = [
  {
    id: "level-1-iron-wall",
    title: "铁壁 · Iron Wall",
    subtitle: "Face the relentless Qin war machine — raw power, no tricks.",
    difficulty: 1,
    opponentFaction: "qin",
    // 25 pure-power Qin units (no effect cards), duplicates from the 7
    // power-only cards: qin-infantry(5), qin-veteran(7), iron-eagle-soldier(6),
    // qin-spear-guard(4), qin-siege-engineer(5), qin-war-chariot(7 — has effect
    // but works as body), qin-arbalest(5 — has effect but mainly body).
    // We keep it to pure body cards only for the tutorial feel.
    opponentDeck: [
      "qin-infantry",
      "qin-infantry",
      "qin-infantry",
      "qin-infantry",
      "qin-veteran",
      "qin-veteran",
      "qin-veteran",
      "qin-veteran",
      "iron-eagle-soldier",
      "iron-eagle-soldier",
      "iron-eagle-soldier",
      "iron-eagle-soldier",
      "qin-spear-guard",
      "qin-spear-guard",
      "qin-spear-guard",
      "qin-spear-guard",
      "qin-siege-engineer",
      "qin-siege-engineer",
      "qin-siege-engineer",
      "qin-siege-engineer",
      "legalist-officer",
      "legalist-officer",
      "legalist-officer",
      "wang-jian",
      "wang-jian",
    ],
    deckConstraint: { allowDuplicates: true },
    winCondition: { type: "standard" },
    hint: "Out-tempo the opponent: play strong cards early and pass before they do.",
  },

  {
    id: "level-2-swarm",
    title: "蜂涌 · The Swarm",
    subtitle: "Chu tokens flood the board — bring high-power answers.",
    difficulty: 2,
    opponentFaction: "chu",
    // Heavy on token generators and row buffs.
    opponentDeck: [
      "chu-shaman",
      "chu-shaman",
      "chu-shaman",
      "chu-herald",
      "chu-herald",
      "chu-herald",
      "chu-battle-cry",
      "chu-battle-cry",
      "chu-flood-tactic",
      "chu-flood-tactic",
      "chu-war-dancer",
      "chu-war-dancer",
      "chunshen-retainer",
      "chunshen-retainer",
      "xiang-yan",
      "xiang-yan",
      "lord-chunshen",
      "lord-chunshen",
      "king-of-chu",
      "chu-footsoldier",
      "chu-footsoldier",
      "chu-shield-bearer",
      "chu-shield-bearer",
      "chu-river-guard",
      "chu-spearman",
    ],
    deckConstraint: {
      allowDuplicates: true,
      requiredFactions: ["qin"],
    },
    winCondition: { type: "standard" },
    hint: "Include at least 3 Qin cards. High single-unit power beats a swarm of weak tokens.",
  },

  {
    id: "level-3-scholar",
    title: "谋算 · The Scholar",
    subtitle: "Qi masters hand advantage — your deck cannot repeat a single card.",
    difficulty: 3,
    opponentFaction: "qi",
    // Qi hand-control: lots of DRAW_DISCARD to keep quality high.
    opponentDeck: [
      "jixia-scholar",
      "jixia-scholar",
      "guan-zhong-legacy",
      "guan-zhong-legacy",
      "sun-bin",
      "sun-bin",
      "tian-ji",
      "tian-ji",
      "jixia-strategist",
      "jixia-strategist",
      "qi-scout",
      "qi-scout",
      "plan-of-jixia",
      "plan-of-jixia",
      "sun-tzu",
      "tian-dan",
      "guan-zhong",
      "qi-iron-cavalry",
      "qi-warrior",
      "qi-spearman",
      "qi-crossbowman",
      "qi-siege-crew",
      "qi-spearman",
      "qi-crossbowman",
      "qi-siege-crew",
    ],
    deckConstraint: {
      allowDuplicates: false, // All 25 cards must be unique
    },
    winCondition: { type: "standard" },
    hint: "No duplicates allowed — build a tight 25-card selection from the full card pool.",
  },

  {
    id: "level-4-comeback",
    title: "逆转 · The Comeback",
    subtitle: "Zhao saves its burst for rounds 2 and 3 — you must win round 2.",
    difficulty: 3,
    opponentFaction: "zhao",
    // Zhao burst: CONDITIONAL_BOOST when behind; opponent concedes round 1
    // cheaply, then pours everything into rounds 2 and 3.
    opponentDeck: [
      "zhao-heavy-cavalry",
      "zhao-heavy-cavalry",
      "zhao-heavy-cavalry",
      "lin-xiangru",
      "lin-xiangru",
      "king-of-zhao",
      "king-of-zhao",
      "li-mu",
      "li-mu",
      "lian-po",
      "lian-po",
      "zhao-she",
      "zhao-she",
      "zhao-ambush",
      "zhao-ambush",
      "zhao-warlord",
      "zhao-warlord",
      "zhao-vanguard",
      "zhao-vanguard",
      "hu-clothing-cavalry",
      "hu-clothing-cavalry",
      "zhao-border-cavalry",
      "zhao-border-cavalry",
      "zhao-footsoldier",
      "zhao-archer",
    ],
    deckConstraint: { allowDuplicates: true },
    winCondition: { type: "must_win_round2" },
    hint: "The opponent will concede round 1. Conserve your best cards for round 2 — you must win it.",
  },

  {
    id: "level-5-coalition",
    title: "合纵 · Coalition",
    subtitle: "Elite warriors from all four states — no single weakness to exploit.",
    difficulty: 4,
    opponentFaction: "qin", // Mixed deck; faction label is cosmetic
    // Best units spread across all four factions.
    opponentDeck: [
      // Qin elites
      "bai-qi",
      "wang-jian",
      "shang-yang",
      "qin-arbalest",
      "qin-war-chariot",
      "legalist-officer",
      // Chu elites
      "king-of-chu",
      "lord-chunshen",
      "xiang-yan",
      "chu-war-dancer",
      "chu-herald",
      // Qi elites
      "sun-tzu",
      "tian-dan",
      "guan-zhong",
      "jixia-strategist",
      "sun-bin",
      // Zhao elites
      "king-of-zhao",
      "lin-xiangru",
      "zhao-she",
      "li-mu",
      "lian-po",
      // Fillers
      "qin-cavalry-charge",
      "zhao-ambush",
      "plan-of-jixia",
      "chu-battle-cry",
    ],
    deckConstraint: {
      allowDuplicates: true,
      minFactions: 2,
    },
    winCondition: { type: "standard" },
    hint: "Your deck must span at least 2 factions. Mixing strengths is the only way to match the coalition.",
  },

  {
    id: "level-6-apex",
    title: "王道 · Apex",
    subtitle: "The full Qin arsenal at peak efficiency — no restrictions, no mercy.",
    difficulty: 5,
    opponentFaction: "qin",
    // Optimal Qin 25: highest-value cards, two copies of the best ones.
    opponentDeck: [
      "bai-qi",
      "bai-qi",
      "wang-jian",
      "wang-jian",
      "shang-yang",
      "shang-yang",
      "qin-arbalest",
      "qin-arbalest",
      "qin-war-chariot",
      "qin-war-chariot",
      "legalist-officer",
      "legalist-officer",
      "qin-cavalry-charge",
      "qin-cavalry-charge",
      "qin-conscription",
      "qin-conscription",
      "qin-veteran",
      "qin-veteran",
      "iron-eagle-soldier",
      "iron-eagle-soldier",
      "qin-infantry",
      "qin-infantry",
      "qin-spear-guard",
      "qin-siege-engineer",
      "qin-crossbow-formation",
    ],
    deckConstraint: { allowDuplicates: true },
    winCondition: { type: "standard" },
    hint: "No restrictions. Study the previous levels and build the deck you trust most.",
  },
];

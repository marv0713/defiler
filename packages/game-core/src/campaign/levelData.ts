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
 *
 * Level 3 — 谋算 The Scholar
 *   Qi hand-control. Opponent generates card advantage with DRAW_DISCARD.
 *
 * Level 4 — 逆转 The Comeback
 *   Zhao burst. Opponent is stacked with CONDITIONAL_BOOST and deliberately
 *   concedes round 1, then explodes in round 2–3.
 *   Win condition: player must also win round 2 to prove comeback awareness.
 *
 * Level 5 — 合纵 Coalition
 *   Mixed elite units from all four factions. No obvious hole to exploit.
 *
 * Level 6 — 王道 Apex
 *   Strongest Qin selection. Normal AI at its best.
 *   No player constraint; full 60-card pool available.
 *
 * Text IDs
 * ────────
 * subtitleTextId / hintTextId resolve via the i18n dictionary in apps/web.
 * Pattern: "level.<id>.subtitle" and "level.<id>.hint".
 */
export const CAMPAIGN_LEVELS: LevelDefinition[] = [
  {
    id: "level-1-iron-wall",
    title: "铁壁 · Iron Wall",
    subtitleTextId: "level.level-1-iron-wall.subtitle",
    difficulty: 1,
    opponentFaction: "qin",
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
    hintTextId: "level.level-1-iron-wall.hint",
  },

  {
    id: "level-2-swarm",
    title: "蜂涌 · The Swarm",
    subtitleTextId: "level.level-2-swarm.subtitle",
    difficulty: 2,
    opponentFaction: "chu",
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
    },
    winCondition: { type: "standard" },
    hintTextId: "level.level-2-swarm.hint",
  },

  {
    id: "level-3-scholar",
    title: "谋算 · The Scholar",
    subtitleTextId: "level.level-3-scholar.subtitle",
    difficulty: 3,
    opponentFaction: "qi",
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
    deckConstraint: { allowDuplicates: true },
    winCondition: { type: "standard" },
    hintTextId: "level.level-3-scholar.hint",
  },

  {
    id: "level-4-comeback",
    title: "逆转 · The Comeback",
    subtitleTextId: "level.level-4-comeback.subtitle",
    difficulty: 3,
    opponentFaction: "zhao",
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
    hintTextId: "level.level-4-comeback.hint",
  },

  {
    id: "level-5-coalition",
    title: "合纵 · Coalition",
    subtitleTextId: "level.level-5-coalition.subtitle",
    difficulty: 4,
    opponentFaction: "qin",
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
    deckConstraint: { allowDuplicates: true },
    winCondition: { type: "standard" },
    hintTextId: "level.level-5-coalition.hint",
  },

  {
    id: "level-6-apex",
    title: "王道 · Apex",
    subtitleTextId: "level.level-6-apex.subtitle",
    difficulty: 5,
    opponentFaction: "qin",
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
    hintTextId: "level.level-6-apex.hint",
  },
];

# Warring States Card Tactics | 战国卡牌 (Defiler)

A browser-first, Gwent-style deckbuilding card game set in the Warring States period of ancient China. Built with React, Zustand, TypeScript, and a separated pure game engine module.

一款基于中国战国时代背景的浏览器首发、昆特牌风格的卡牌对战游戏。使用 React、Zustand、TypeScript 编写，并配有完全解耦的纯游戏规则引擎。

---

## Key Features | 核心特性

- **Gwent-style Row-based Combat | 昆特牌式排位战力对抗**: 
  Units are played across three rows (Melee 近战, Ranged 远程, Siege 攻城). Win 2 out of 3 rounds by scoring the highest total board power.
  单位部署在近战、远程、攻城三排。通过每轮结算时的高战力点数赢下三局两胜制的比赛。

- **Campaign Mode with Progressive Challenges | 战役模式与六大难关**:
  - **Level 1: Iron Wall (铁血秦军)** - Simple Qin force, raw power.
  - **Level 2: Swarm (泽国楚军)** - Token warriors flooding the board.
  - **Level 3: Scholar (齐鲁名士)** - High-rarity Qi cards with copy constraints.
  - **Level 4: Comeback (赵国回响)** - Zhao bursts power in rounds 2 and 3.
  - **Level 5: Coalition (合纵连横)** - Elite multi-faction soldiers.
  - **Level 6: Apex (王道霸业)** - The ultimate Qin army with no restrictions.

- **Distinct Faction Traits | 阵营特色与被动**:
  Choose Qin (🔴 aggressive power), Chu (🔵 summon swarm), Qi (🟡 card advantage), or Zhao (🟢 round comeback buffers).
  选择秦（🔴 战力压制）、楚（🔵 小兵铺场）、齐（🟡 手牌优势）或赵（🟢 逆境爆发）四大阵营，各具独特的阵营被动。

- **Lookahead 3-Ply Strategic AI | 3-Ply 战略型前瞻 AI**:
  High difficulty campaign levels are driven by a multi-step minimax lookahead AI that plans moves ahead, prevents early concession in survival rounds, and strategically conserves legendary/hero finishers.
  高难度关卡由多步 Minimax 极小化极大决策树驱动，具备前瞻规划能力，防范生死局提前认输，并懂得在首轮保留传说大怪等高级策略。

- **Local Profiles & Save Slots | 本地多存档与多玩家隔离**:
  Create multiple offline player profiles on the same device. Deck building and level unlocking progress are fully isolated per profile.
  支持在同一台电脑浏览器中创建多个玩家存档，每个存档的卡组配置与战役通关进度完全隔离、互不影响。

- **Card Details sidebar & Glossary | 实时卡牌详情与名词解释边栏**:
  Interactive right-sidebar showing real-time card stats on hover/focus, and a terminology glossary explaining effects like **Lock (封锁)**, **Revive (复活)**, **Summon (召唤)**, **Special (计策)**, and **Boost (条件强化)**.
  交互式右侧栏在鼠标悬停卡牌时展示精美的卡牌属性大图，空闲时展示名词解释，详解“封锁”、“复活”、“召唤”、“计策”等核心机制。

---

## Tech Stack | 技术栈

- **Monorepo Management**: `pnpm` workspace structure.
- **Game Engine Core (`packages/game-core`)**: Pure TypeScript rule processor, fully decoupled from React and browser-specific APIs for deterministic gameplay and testing.
- **Frontend App (`apps/web`)**: React, Zustand (persisted local storage save-states), Vanilla CSS (delivering a rich, gold-accented historical theme).
- **Tooling & Tests**: Vite, Vitest (180+ unit and simulation tests with 100% pass rate).

---

## Project Structure | 项目结构

```text
defiler/
  ├── apps/
  │   └── web/                # React UI,zustand store, CSS themes
  ├── packages/
  │   └── game-core/          # Core rules engine, card data, AI modules
  ├── docs/                   # Specs, technical plans, and design logs
  ├── pnpm-workspace.yaml     # Monorepo workspaces
  └── package.json
```

---

## Getting Started | 如何运行

### Prerequisites | 环境要求

Make sure you have [Node.js](https://nodejs.org/) and `pnpm` installed.

### 1. Install Dependencies | 安装依赖
```bash
pnpm install
```

### 2. Start Development Server | 启动开发服务器
```bash
pnpm dev
```
Open [http://localhost:5173/](http://localhost:5173/) to play in your browser.

### 3. Run Test Suite | 运行测试
```bash
pnpm test
```

### 4. Build Production Bundle | 打包项目
```bash
pnpm build
```

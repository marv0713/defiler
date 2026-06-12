# Product Design Document: Warring States Card Tactics

## 1. Product Overview

### 1.1 Working Title

Chinese working title: 战国牌策  
English working title: Warring States: Card Tactics

The name can be changed later. The overseas version should prioritize the English title.

### 1.2 Product Positioning

This product is a single-player tactical card game set in the Spring and Autumn / Warring States period of ancient China.

The core gameplay uses a multi-lane card battle structure:

- Multiple battlefield rows
- Turn-based card play
- Power comparison
- Best-of-three round structure
- Strategic pass timing
- Faction-based card identity

All cards, factions, values, skills, art, UI, names, and campaign content should be original.

The first version should not include:

- Online PvP
- Ranked ladder
- Account system
- Card packs
- Gacha
- Complex monetization
- Heavy animation
- Large-scale story mode

The first version should validate whether the core battle system is fun.

### 1.3 Core Product Idea

A small-scale, single-player, lane-based tactical card battler where the player chooses a Warring States faction and fights AI opponents through short strategic battles.

The MVP should prove:

1. Whether the battle rules are fun.
2. Whether players understand the game within a few minutes.
3. Whether players want to play another match.
4. Whether the Warring States theme gives the game enough differentiation.
5. Whether a solo developer using AI-assisted coding can build a playable prototype within a limited scope.

### 1.4 Core Selling Points

- Ancient China / Warring States theme.
- Tactical three-row card battles.
- Short matches, ideally 5 to 10 minutes.
- Single-player AI battles.
- Faction identity based on historical states.
- Config-driven card system.
- Balance supported by automated simulations.
- No dependency on online player population.

---

## 2. Target Audience

### 2.1 Primary Audience

Overseas players who enjoy:

- Tactical card games
- Indie strategy games
- Historical themes
- Short-session strategy gameplay
- Deck-based or hand-management games

Potential reference audience:

- Gwent players
- Hearthstone players
- Slay the Spire players
- Monster Train players
- Marvel Snap players
- Board-game-like strategy players

### 2.2 Secondary Audience

Chinese-speaking players who enjoy:

- Card battlers
- Strategy games
- Ancient Chinese history
- Spring and Autumn / Warring States stories
- Independent games
- AI-assisted game development content

### 2.3 User Needs

Players may want:

- A compact but strategic card game.
- Meaningful decisions around when to commit cards and when to pass.
- Different faction playstyles.
- A historical setting that feels different from common fantasy card games.
- A single-player game that does not require daily grinding or online matchmaking.

---

## 3. Product Scope

### 3.1 MVP Scope

The MVP should be a playable Web demo.

Included:

- Single-player AI battle.
- Three battlefield rows.
- Best-of-three rounds.
- Four factions: Qin, Chu, Qi, Zhao.
- 60 to 80 cards.
- 10 to 15 reusable skill templates.
- 10 to 15 tutorial/challenge levels.
- Basic English UI.
- Basic combat log.
- No account.
- No backend.
- No payment.
- No online PvP.

Excluded:

- Online multiplayer.
- Ranked ladder.
- Card packs.
- Gacha.
- Complex campaign map.
- Full seven-state card pool.
- Large-scale card art.
- Heavy animations.
- Voice acting.
- Cloud save.
- Mobile store release at MVP stage.

### 3.2 Future Scope

If the MVP receives good feedback, future versions may include:

- More factions: Wei, Han, Yan, Neutral Hundred Schools.
- Roguelike campaign mode.
- Random events.
- State policy system.
- More challenge levels.
- Mobile layout.
- PWA support.
- iOS TestFlight.
- iOS full release.
- Steam or itch.io full version.
- Paid expansion packs.

---

## 4. Core Gameplay

### 4.1 Match Structure

Each match is played as a best-of-three battle.

Each player has:

- Deck
- Hand
- Board
- Graveyard
- Pass state
- Round win count

During a round, players alternate turns.

On a turn, the active player may:

1. Play one card.
2. Pass.

When both players have passed, the round ends.

The player with the higher total board power wins the round.

The first player to win two rounds wins the match.

### 4.2 Battlefield Rows

The board has three rows:

1. Melee
2. Ranged
3. Siege

Each unit card has a valid row.

Special cards may affect:

- One unit
- One row
- Multiple rows
- The whole board
- The player's hand/deck/graveyard

### 4.3 Card Types

MVP card types:

1. Unit Card  
   Has power and enters the battlefield.

2. Special Card  
   Has no lasting body. It resolves an effect and then goes to graveyard.

3. Weather / Terrain Card  
   Optional for MVP. Can affect one row or multiple rows. Should be delayed if it increases complexity too much.

### 4.4 Card Budget System

Cards should be designed using a simple internal budget model.

Formula:

```text
Total card value = base power + skill value
```

Suggested budget tiers:

| Tier | Budget | Role |
|---|---:|---|
| Common Soldier | 4-6 | Basic filler |
| Elite | 7-9 | Efficient unit or small skill |
| Hero | 10-12 | Strong build-around card |
| Legend / Ruler | 13-15 | Finisher or faction-defining card |

Example:

```text
Bai Qi
Total budget: 13
Skill: Destroy enemy lowest-power unit, estimated value 4
Base power: 9
```

This does not need to be perfect. It is only a starting framework for balance.

---

## 5. Faction Design

### 5.1 Qin

Keywords:

- High power
- Pressure
- Direct removal
- Stability

Playstyle:

- Strong raw power.
- Simple and direct effects.
- Weak card draw.
- Strong at punishing low-power enemy units.
- Beginner-friendly.

Weaknesses:

- Less flexible.
- Weak long-term resource generation.
- Slower swarm potential.

Example cards:

| Card | Power | Row | Skill |
|---|---:|---|---|
| Qin Infantry | 5 | Melee | None |
| Qin Veteran | 6 | Melee | None |
| Iron Eagle Soldier | 8 | Melee | None |
| Legalist Officer | 4 | Ranged | Boost allied lowest unit by 3 |
| Qin Crossbow Formation | 4 | Ranged | Damage random enemy by 2 twice |
| Wang Jian | 9 | Melee | If you are ahead, boost self by 2 |
| Bai Qi | 9 | Melee | Destroy enemy lowest-power unit |

### 5.2 Chu

Keywords:

- Swarm
- Row buffs
- Unit count
- Explosive scaling

Playstyle:

- Lower individual card power.
- Summons tokens.
- Benefits from having many units.
- Strong row-wide buffs.
- Can generate large board swings.

Weaknesses:

- Vulnerable to row damage.
- Vulnerable to weather/terrain.
- Lower standalone unit quality.

Example cards:

| Card | Power | Row | Skill |
|---|---:|---|---|
| Chu Spearman | 4 | Melee | None |
| Chu Archer | 4 | Ranged | None |
| Shaman | 3 | Ranged | Summon one 2-power token |
| Lord Chunshen's Retainer | 4 | Ranged | Boost two random allied units by 1 |
| Xiang Yan | 6 | Melee | Gain 1 for every two allied melee units |
| King of Chu | 10 | Melee | If you have at least 6 units, boost self by 3 |

### 5.3 Qi

Keywords:

- Card draw
- Planning
- Filtering
- Resource advantage

Playstyle:

- Lower immediate power.
- Better hand quality.
- Draw/discard mechanics.
- Wins through resource control across rounds.
- More difficult to play.

Weaknesses:

- Weaker tempo.
- Can be pressured by Qin or Zhao.
- Draw effects are dangerous and must be priced carefully.

Example cards:

| Card | Power | Row | Skill |
|---|---:|---|---|
| Qi Warrior | 6 | Melee | None |
| Jixia Scholar | 4 | Ranged | Draw 1, discard 1 |
| Guan Zhong's Legacy | - | Special | Draw 2, discard 1 |
| Sun Bin | 6 | Ranged | Damage enemy highest unit by 3 |
| Tian Ji | 5 | Melee | If behind, draw 1 and discard 1 |

### 5.4 Zhao

Keywords:

- Cavalry
- Comeback
- Tempo
- Conditional power

Playstyle:

- Medium-high power.
- Strong when behind.
- Encourages pass mind games.
- Good tempo swings.

Weaknesses:

- Some cards become weaker when already ahead.
- Conditional effects may fail.
- Requires more judgment.

Example cards:

| Card | Power | Row | Skill |
|---|---:|---|---|
| Zhao Border Cavalry | 6 | Melee | None |
| Hu Clothing Cavalry | - | Special | Boost allied cavalry by 1 |
| Li Mu | 8 | Ranged | If behind, boost self by 3 |
| Lian Po | 9 | Melee | If enemy has passed, boost self by 2 |
| Zhao Raid | - | Special | Damage two random enemy units by 2 |

---

## 6. Skill System

### 6.1 MVP Skill Templates

The MVP should use a limited skill set.

Recommended skill templates:

| Skill Type | Description |
|---|---|
| BUFF | Increase power of target unit(s) |
| DAMAGE | Decrease power of target unit(s) |
| DESTROY | Destroy target unit |
| SUMMON | Create token or specific unit |
| DRAW_DISCARD | Draw cards and discard cards |
| REVIVE | Return low-power unit from graveyard |
| LOCK | Disable a unit's skill |
| CLEAR_WEATHER | Remove weather/terrain |
| CONDITIONAL_BOOST | Boost if condition is met |
| ROW_EFFECT | Apply effect to a full row |
| SPY_LIKE | Give opponent power, gain card advantage, optional |
| WEATHER | Apply row modifier, optional |

### 6.2 Initial Skill Valuation

| Effect | Estimated Value |
|---|---:|
| Boost allied unit by 1 | 1 |
| Boost allied unit by 2 | 2 |
| Damage enemy unit by 1 | 1 |
| Damage enemy unit by 2 | 2 |
| Damage random enemy unit by 2 | 1.5 |
| Damage enemy highest unit by 3 | 3.5 |
| Boost allied row by 1 | 4 |
| Damage enemy row by 1 | 4 |
| Draw 1 card | 3.5 |
| Draw 2, discard 1 | 4 |
| Summon one 2-power token | 2 |
| Revive one low-power unit | 4 |
| Destroy enemy lowest unit | 4 |
| Destroy enemy highest unit | 7-8 |
| Clear weather/terrain | 2.5 |
| Lock enemy skill | 3 |

### 6.3 Conditional Discounts

Effects should be discounted based on activation difficulty.

| Condition | Value Multiplier |
|---|---:|
| Immediate unconditional effect | 100% |
| Requires allied tag/type | 80% |
| Requires being behind | 75% |
| Requires enemy unit in specific row | 85% |
| Random target | 70%-85% |
| Delayed trigger | 70%-80% |
| Only works in round 1 | 60%-70% |
| Requires combo with another card | 60%-80% |

---

## 7. Game Modes

### 7.1 Quick Battle

Player chooses a faction and fights AI in a full best-of-three match.

Purpose:

- Test the battle system.
- Let players quickly experience factions.
- Provide replayable basic gameplay.

### 7.2 Tutorial Levels

Tutorial should teach only one concept at a time.

Suggested tutorial sequence:

1. Playing units and calculating power.
2. Three rows.
3. Best-of-three rounds.
4. Passing.
5. Unit skills.
6. Row effects.
7. Draw/discard.
8. Faction identity.

### 7.3 Challenge Levels

Challenge levels use fixed AI decks and scripted setups.

Example challenge themes:

- Qin raw power pressure.
- Chu swarm board.
- Qi resource control.
- Zhao comeback mechanics.
- Limited hand challenge.
- Pass timing challenge.
- Specific card combo challenge.

### 7.4 Future Roguelike Mode

Not part of MVP.

Possible future design:

- Choose a starting faction.
- Fight a series of battles.
- Gain cards after each win.
- Choose policies or relics.
- Face final campaign opponent.

---

## 8. Art and Presentation

### 8.1 MVP Art Strategy

Do not require full card art in MVP.

Use:

- Text-based cards.
- Simple card frames.
- Faction colors.
- Row icons.
- Basic background.
- Minimal animation.
- Optional AI-generated abstract portraits or patterns.

Avoid:

- Large character illustration workload.
- Complex animated effects.
- Full historical scene paintings.
- Inconsistent AI art styles.
- Art-heavy production before gameplay is validated.

### 8.2 Visual Direction

Keywords:

- Ancient China
- Warring States
- Ink
- Bronze
- Bamboo slips
- War banners
- Seals
- Strategy map
- Tactical board

### 8.3 Store / Marketing Copy Direction

Use:

```text
A tactical lane-based card battler set in ancient China.
```

Avoid:

```text
Gwent-like
Chinese Gwent
Witcher-style card game
```

---

## 9. Monetization Strategy

### 9.1 MVP Stage

No monetization.

Main goal:

- Collect feedback.
- Validate fun.
- Build small player list.
- Observe whether players ask for more.

### 9.2 Possible Paid Version

If feedback is positive:

Option A: Free demo + one-time unlock

Free version:

- 2 factions
- 8 to 10 levels
- Basic challenge mode

Full unlock:

- 4+ factions
- 60 to 100 cards
- 30+ levels
- Challenge mode
- Future updates

Suggested iOS price:

```text
$1.99 or $2.99
```

Option B: Low-price buy-to-play

Possible platforms:

- itch.io
- Steam
- iOS

### 9.3 Avoid in Early Version

Do not add:

- Gacha
- Paid card packs
- Paid power advantage
- Subscriptions
- Battle pass
- Heavy live-service mechanics

These increase design, legal, and operational complexity.

---

## 10. Legal and IP Guidelines

### 10.1 IP Safety

The game must not use:

- Gwent
- The Witcher
- Witcher characters
- Witcher factions
- Witcher card art
- Witcher UI
- Witcher icons
- Original Gwent card values and exact skill combinations

The game may use:

- General lane-based card game ideas
- Original Warring States factions
- Original card names
- Original card effects
- Original UI
- Original art
- Original card database

### 10.2 AI Art Guidelines

If AI-generated art is used:

- Use commercially permitted tools/models.
- Keep generation records.
- Do not generate art that resembles known copyrighted characters.
- Do not use third-party copyrighted art as direct image input.
- Maintain a consistent style.

### 10.3 App Store Readiness

For future iOS release:

- Prepare privacy policy.
- Avoid unnecessary personal data collection.
- Avoid unnecessary ad SDKs.
- Avoid misleading claims.
- Avoid gambling-like random paid card packs.
- Ensure all content is original.

---

## 11. Roadmap

### Week 1: Core Rules

Deliverables:

- Card type definitions.
- GameState.
- PlayerState.
- Shuffle/draw.
- Play card.
- Pass.
- Round settlement.
- Best-of-three match.
- Command-line or test-based battle.

### Week 2: Cards and Basic Skills

Deliverables:

- 20 test cards.
- Config-driven card data.
- 5 to 8 basic skills.
- Simple AI.

### Week 3: MVP Card Pool

Deliverables:

- Qin cards.
- Chu cards.
- Qi cards.
- Zhao cards.
- 60-card initial pool.
- English card descriptions.

### Week 4: Simulation

Deliverables:

- AI vs AI simulator.
- 1,000 to 10,000 match simulation.
- Faction win rates.
- Card-level stats.
- First balance adjustment.

### Week 5: Web UI

Deliverables:

- React UI.
- Board display.
- Hand display.
- Score display.
- Pass button.
- Combat log.
- Round result modal.

### Week 6: Tutorial and Challenges

Deliverables:

- Level configuration.
- 5 tutorial levels.
- 10 challenge levels.
- Basic local progress save.

### Week 7: Polish and Publish Prep

Deliverables:

- Bug fixing.
- UI clarity improvement.
- Basic mobile-friendly layout, optional.
- itch.io or Web landing page.
- Feedback form.

### Week 8: Public Test

Deliverables:

- Web demo published.
- 20 to 50 testers.
- Feedback collected.
- Balance report.
- Decision on whether to continue.

---

## 12. Success Metrics

### 12.1 Continue Criteria

Continue development if at least three of these are true:

- 20+ real players try the demo.
- Some players play a second match.
- Some players give card balance feedback.
- Some players ask about updates.
- Some players join a mailing list or community.
- Some players say they would pay $1.99 for a full version.
- The developer still enjoys playing and improving the game.

### 12.2 Stop or Reduce Scope Criteria

Stop expanding scope if:

- No playable demo after 8 weeks.
- The developer does not enjoy playing the game.
- Testers cannot understand the rules.
- Nobody wants to play a second match.
- Most development time is consumed by art/platform issues.
- The project harms main income or mental stability.

### 12.3 Product Mindset

This project should start as a low-cost product experiment.

It is not:

- A guaranteed business.
- A short-term cashflow solution.
- A live-service game.
- A full commercial card game from day one.

The first goal is to validate whether:

```text
Warring States theme + lane-based tactical card battle + single-player campaign
```

can attract a small but real audience.

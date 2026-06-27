# Warring States Card Strategy: Campaign Page and Deckbuilding Page Optimization

Version: v0.1  
Scope: Web PVE prototype, future WeChat mini-game adaptation, and iOS mobile adaptation  
Covered pages:

1. Campaign Page: faction selection, campaign stage selection, and challenge entry.
2. Deckbuilding Page: build a campaign deck under a locked faction and start the challenge.

---

# 1. Campaign Page Optimization

## 1.1 Current Page Purpose

The campaign page should guide the player through this path:

```text
Choose a faction
↓
Understand the faction playstyle and available campaign deck
↓
View the campaign route
↓
Select the current available challenge
↓
Enter deckbuilding / start challenge
```

The current page already supports basic functions:

- Back button
- Campaign title
- Faction selection: Qin, Chu, Qi, Zhao
- Multiple campaign stage cards
- Locked stage state
- Simple star display
- Short stage descriptions

However, it currently feels more like a stage list than a player-facing campaign flow.

---

## 1.2 Current Issues

### 1.2.1 The campaign flow is not clear enough

Players may not understand:

- Am I choosing a faction or a stage?
- What changes after selecting a faction?
- Why are some stages locked?
- What is the campaign goal?
- Are stages linear or freely selectable?
- Does each faction have its own campaign progression?

Recommended top-page description:

```text
Choose a Warring States faction and use its fixed campaign deck to complete six challenges.
Each challenge tests a different mechanic: points, swarm, control, comeback, and resource management.
```

If stages are unlocked linearly, state it clearly:

```text
Complete the current stage to unlock the next campaign challenge.
```

---

### 1.2.2 Faction selection is too weak

Currently, Qin / Chu / Qi / Zhao are shown as small buttons. In a card strategy game, faction selection is a major decision. It affects:

- Available cards
- Fixed campaign deck
- Playstyle
- Difficulty
- Strategy / leader skill
- Recommended tactics

Recommended faction card example:

```text
Qin
Style: Direct pressure / high base power
Difficulty: ★☆☆☆☆
Recommended for: Beginners
Core keywords: Buff, Siege, Heavy Armor
Available cards: 25
Strategy: Tiger & Wolf
```

```text
Chu
Style: Summon swarm / multi-unit synergy
Difficulty: ★★☆☆☆
Recommended for: Players who enjoy board flooding and chain effects
Core keywords: Summon, Reinforce, Synergy
Available cards: 25
Strategy: Muster
```

This helps players understand that they are not selecting a color, but a playstyle.

---

### 1.2.3 Missing current faction deck preview

After choosing a faction, players should understand what cards they can use. The current page does not show:

- Available card count
- Unit / tactic ratio
- Melee / ranged / siege structure
- Core cards
- Faction playstyle
- Beginner friendliness

Recommended “Current Faction Details” section:

```text
Qin Campaign Deck: 25 Cards

Units: 18
Tactics: 5
Specials: 2

Core Cards:
- Wang Jian: high-power finisher
- Qin Infantry: stable point card
- Legalist Reform: friendly unit buff
- Volley: ranged damage
- Tiger & Wolf: strategy skill

Playstyle:
Qin is beginner-friendly. It wins through high base power and simple buffs.
```

A simple preview is enough for the first version.

---

### 1.2.4 Stage cards lack motivation

Current stage cards show:

- Stage name
- Short description
- Stars
- Opposing faction
- Lock state

But players still do not know:

- What does this stage teach?
- What is the enemy mechanic?
- What is the reward?
- Why is it locked?
- How does this stage relate to the selected faction?

Recommended stage card:

```text
Stage 1: Iron Wall
Enemy: Qin Iron Wall
Mechanic: high-power units with few complex effects
Learning Goal: basic card play and score comparison
Recommended Faction: Qin
Reward: unlock Qin Archer ×1
State: Available
```

Locked stage example:

```text
Locked
Complete the previous stage to unlock.
```

or:

```text
Locked
Complete Stage 2: The Swarm first.
```

---

### 1.2.5 Star meaning is unclear

The current star display does not explain whether it means:

- Difficulty
- Clear rating
- Completion
- Best score
- Recommendation level

Recommended labels:

```text
Difficulty: ★★☆☆☆
```

or:

```text
Best Score: ★★★☆☆
```

or:

```text
Clear Rating: ★★☆☆☆
```

Do not show stars without a label.

---

### 1.2.6 Visual hierarchy is flat

Current issues:

- Top-left information is crowded.
- There is a large amount of empty space on the right.
- Stage cards are wide but sparse.
- Available and locked stages are not visually distinct enough.
- Selected faction is not prominent.
- The page lacks a campaign-map or route feeling.

Recommended information flow:

```text
Faction Selection
↓
Current Faction Details
↓
Campaign Route
↓
Current Stage Details
↓
Start Challenge
```

---

## 1.3 Recommended Campaign Page Structure

### Desktop Three-Column Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Back      Campaign Mode                                     │
│ Choose a faction and use its fixed campaign deck to complete six challenges. │
│ Each challenge tests points, swarm, control, comeback, and resource management. │
├──────────────────────────────────────────────────────────────┤
│ Faction Selection                                             │
│ [Qin｜High Power｜Beginner] [Chu｜Summon Swarm] [Qi｜Hand Tactics] [Zhao｜Comeback] │
├───────────────────────┬──────────────────────┬───────────────┤
│ Current Faction: Qin   │ Campaign Route        │ Stage Details  │
│ Style: Direct pressure │ ① Iron Wall Available │ Iron Wall      │
│ Strategy: Tiger & Wolf │ ② Swarm Locked        │ Enemy: Qin Army│
│ Difficulty: ★☆☆☆☆      │ ③ Scholar Locked      │ Mechanic: Power│
│ Recommended: Beginner  │ ④ Comeback Locked     │ Goal: Basics   │
│                        │ ⑤ Coalition Locked    │ Reward: Archer │
│ Deck: 25 Cards         │ ⑥ Apex Locked         │               │
│ Units 18｜Tactics 5    │                      │ [Start]        │
│ Core: Wang Jian...     │                      │               │
│ [View Full Deck]       │                      │               │
└───────────────────────┴──────────────────────┴───────────────┘
```

### Card-Based Alternative

If keeping the current card grid, add a faction detail section:

```text
Top:
Back｜Campaign Mode
Description: Choose a faction and use its fixed campaign deck to complete 6 challenges.

Faction Area:
[Qin Card] [Chu Card] [Qi Card] [Zhao Card]

Current Faction Details:
Qin｜Tiger & Wolf
Style: High Power / Buff / Direct Pressure
Difficulty: Beginner-friendly
Deck: 25 Cards
Core Cards: Wang Jian, Qin Infantry, Legalist Reform, Volley
[View Deck]

Stage Area:
[Stage 1 Iron Wall] [Stage 2 The Swarm] [Stage 3 The Scholar]
[Stage 4 Comeback] [Stage 5 Coalition] [Stage 6 Apex]
```

---

## 1.4 Campaign Page Priority Changes

Recommended implementation order:

1. Change faction buttons into faction cards showing style, difficulty, strategy, and core keywords.
2. Add current faction deck preview with structure and core cards.
3. Add enemy mechanic, reward, unlock condition, and start button to stage cards.
4. Clarify campaign flow copy: selected faction uses a fixed deck to complete consecutive challenges.
5. Improve locked state with clear unlock reason.
6. Gradually change the page from a stage card list into a “faction + route + details” structure.

---

## 1.5 Mobile Adaptation Challenges

A desktop three-column layout does not fit mobile. Recommended mobile structure:

```text
Top: campaign description
Faction selection: horizontal scroll cards
Current faction deck: collapsible card
Campaign route: vertical list
Bottom: Start Challenge button
```

Mobile notes:

- Faction cards should not be too small.
- Stage details should expand vertically.
- Selected stage can expand inline.
- Start button should be fixed at the bottom.
- Deck preview should be collapsible.

---

# 2. Deckbuilding Page Optimization

## 2.1 Current Page Purpose

The deckbuilding page should guide the player through this path:

```text
Confirm current stage and rules
↓
Understand the locked campaign faction
↓
View available cards
↓
Adjust current deck
↓
Confirm deck legality
↓
Start challenge
```

The current page already supports basic functions:

- Back to stage button
- Current stage title
- Locked faction display
- Card library on the left
- Current deck in the middle
- Card details on the right
- Auto-fill button
- Deck count display

However, the current page feels more like a database list + selected list + card detail panel. It lacks new-player deckbuilding guidance.

---

## 2.2 Current Issues

### 2.2.1 Deckbuilding rules are not prominent enough

The current page says:

```text
Locked faction: Qin
Deck can only use this faction and neutral cards.
```

This is correct, but not prominent enough. Players need clearer information:

```text
Campaign Faction: Qin
Allowed Cards: Qin cards + Neutral cards
Not Allowed: Chu / Qi / Zhao faction cards
Deck Requirement: 25 / 25 cards
Current Status: Ready to Challenge
```

If the deck is illegal, show a localized message only when it is actually illegal:

```text
The deck can only contain Qin cards and neutral cards.
Please remove cards from other factions before starting the challenge.
```

If the deck is already legal and 25/25, do not show a red error.

---

### 2.2.2 Relationship between card library and current deck is not obvious

Players may not know:

- Clicking a card on the left adds it to the deck.
- Clicking × in the current deck removes it.
- `0/3` and `1/1` mean current count / max count.
- Whether cards can be replaced after the deck is full.
- Whether the right-side panel shows selected or hovered card.

Recommended operation hint:

```text
Click a card on the left to add it to the deck. Click × in the current deck to remove it.
Each card has a maximum copy limit. If the deck is full, remove a card before replacing it.
```

---

### 2.2.3 Card library is too dense

The left-side card list is long and lacks filters, grouping, and sorting. This will become worse as the card pool grows.

Recommended filters:

```text
Filters: [All] [Units] [Tactics] [Melee] [Ranged] [Siege] [Addable]
Sort: [Default] [Power] [Type] [Addable First]
```

For the first version, at least include:

```text
All / Units / Tactics / Addable
```

In campaign mode, it is better to only show current faction cards and neutral cards. Hide other factions to reduce noise.

---

### 2.2.4 Current deck lacks structure statistics

The current “25/25” only confirms count. It does not tell players whether the deck structure makes sense.

Recommended deck statistics:

```text
Current Deck: 25 / 25

Units 18｜Tactics 7
Melee 10｜Ranged 8｜Siege 4｜Neutral 3
Average Power: 4.8
Core Keywords: Buff, Elite, Draw, Discard
```

This teaches players that a deck is a structured system, not a random pile of cards.

---

### 2.2.5 Card detail panel lacks deckbuilding guidance

The right-side card detail panel currently shows card basics, but not why the card should be included.

Recommended addition:

```text
Deckbuilding Advice:
Fits Qin midrange decks. Works well with Legalist Reform and Qin Spearman.
Current Deck: 1/3
Recommended Copies: 2-3
```

Or simpler:

```text
Recommendation: Add
Reason: Stable ranged output for beginner Qin decks.
```

Static copy is enough for the first version.

---

### 2.2.6 Auto-fill button state is confusing

The auto-fill button is in the lower-right area, and may still appear active when the deck is already 25/25.

Recommended actions:

```text
[Auto-fill Recommended Deck]
[Clear Deck]
[Restore Default]
```

Button states:

```text
Deck full: Auto-fill disabled
Deck incomplete: Auto-fill enabled
Deck illegal: Show “Fix Deck”
```

Fix deck logic:

```text
Remove illegal faction cards
Fill with recommended cards for the current faction
```

---

### 2.2.7 Missing clear “Start Challenge” button

The lower-right area currently shows “25/25 cards”, but this is only a status, not a primary action.

The page should have a clear primary button:

```text
Start Challenge
```

Button states:

```text
Legal deck and 25/25: active
Fewer than 25 cards: disabled, show “Need X more cards”
Illegal deck: disabled, show “Remove non-Qin / non-neutral cards”
```

This gives players a clear next step.

---

### 2.2.8 Missing current stage goals and restrictions

The top area has a stage title and a short hint, but does not clearly show:

- Stage goal
- Enemy style
- Special rule
- Deckbuilding recommendation

Recommended stage info card:

```text
Goal: Defeat Qin Iron Wall
Special Rule: You go first
Enemy Style: high base power, low trickery
Deckbuilding Tip: choose high-power units and avoid overly complex tactics
```

This helps players understand why they are building this way.

---

### 2.2.9 Mixed Chinese and English copy

The current page has an English error:

```text
Deck can only contain cards from your campaign faction.
```

If the current language is Chinese, this should be localized. If the current language is English, all UI copy should be English.

For Chinese mode:

```text
牌组只能包含当前战役阵营牌和中立牌。
```

If keeping English names, place them as subtitles:

```text
铁壁
Iron Wall
```

---

## 2.3 Recommended Deckbuilding Page Structure

### Desktop Layout

```text
┌────────────────────────────────────────────────────────────────┐
│ ← Back to Stage Selection                                       │
│ Iron Wall                                                       │
│ Goal: Defeat Qin Iron Wall｜First Player｜Enemy Style: High Power│
├────────────────────────────────────────────────────────────────┤
│ Campaign Faction: Qin｜Allowed Cards: Qin + Neutral｜Deck Required: 25 │
│ Deckbuilding Tip: Prioritize high-power units and reduce complex tactics. │
├──────────────────────────┬────────────────────┬────────────────┤
│ Available Cards           │ Current Deck        │ Card Details    │
│ Filter: [All][Unit][Tactic]│ 25 / 25             │ Tian Ji         │
│ Sort: [Default][Power]     │ Units 18｜Tactics 7 │ Power 5         │
│                           │ Melee 10｜Ranged 8  │ Qi｜Melee｜Elite │
│ [5 Qin Footman 0/3]        │ Siege 4｜Neutral 3  │                │
│ [6 Qin Veteran 0/3]        │                     │ Play: Draw 1    │
│ [8 Iron Eagle 0/2]         │ [6 Qin Warrior ×]   │ then discard 1  │
│ [4 Legalist Officer 0/2]   │ [4 Scholar ×]       │ Deck Advice:    │
│                           │ ...                 │ Current 1/1     │
│                           │                     │ Replace low value│
├──────────────────────────┴────────────────────┴────────────────┤
│ [Auto-fill Recommended Deck] [Clear]              [Start Challenge]│
└────────────────────────────────────────────────────────────────┘
```

---

## 2.4 Mobile Adaptation Challenges

A three-column deckbuilding layout does not work well on mobile. Recommended mobile flow:

```text
Step 1: View current stage info
Step 2: Confirm recommended deck
Step 3: Edit deck only if needed
Step 4: Start challenge
```

Mobile should not enter the full deckbuilder by default. Instead, show:

```text
Qin Recommended Deck 25/25
Units 18｜Tactics 7
Core Cards: Wang Jian, Qin Infantry, Legalist Reform
[Start Challenge]
[Edit Deck]
```

Only after tapping “Edit Deck” should the full card list appear.

Mobile notes:

- Use collapsible sections for deck stats.
- Use bottom sheets for card details.
- Use horizontal filter chips.
- Keep Start Challenge fixed at the bottom.
- Do not show all card details by default.

---

## 2.5 Deckbuilding Page Priority Changes

Recommended implementation order:

1. Change the lower-right primary button to “Start Challenge” instead of using “25/25 cards” as a button.
2. Localize the error message and only show it when the deck is illegal.
3. Clarify top rules: current campaign faction, allowed cards, and deck requirement.
4. Show only current faction cards + neutral cards on the left.
5. Add current deck structure stats: units / tactics / melee / ranged / siege.
6. Add basic filters: All / Units / Tactics / Addable.
7. Add deckbuilding advice, current count, and recommended count to card details.
8. Add current stage goal and deckbuilding tip.
9. Enable / disable auto-fill based on deck status.
10. Use a step-based layout on mobile instead of a three-column layout.

---

# 3. Combined Recommendation

The campaign page and deckbuilding page are part of one continuous flow:

```text
Campaign Page:
Which faction should I choose? Which stage should I play?

Deckbuilding Page:
What cards can I use for this faction? How do I prepare for this fight?

Battle Page:
How do I execute this deck’s strategy?
```

Together, these pages need to answer:

```text
What am I doing?
Why am I limited to this faction?
What resources do I have?
What should I click next?
How does my choice affect the challenge?
```

The most important issue right now is not visual polish, but information structure. First clarify the relationship between faction, deck, stage, and challenge. Then improve the visual layer.

Recommended overall path:

```text
Choose faction
↓
View faction style and deck
↓
Select stage
↓
View enemy mechanic and reward
↓
Confirm / adjust deck
↓
Start challenge
```

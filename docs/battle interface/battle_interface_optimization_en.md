# Warring States Card Strategy: Battle UI Optimization

Version: v0.1  
Scope: Web PVE prototype, future WeChat mini-game adaptation, and iOS mobile adaptation  
Goal: Improve information hierarchy, action guidance, interaction feedback, and reserve space for future strategy / leader skills.

---

## 1. Background

The project is a Warring States themed card strategy game inspired by Gwent and Hearthstone. The first-stage target is a Web-based PVE prototype. Later stages may include WeChat mini-game adaptation, iOS overseas release, and asynchronous PVP-like challenge modes.

The current battle interface already supports the core elements:

- Battlefield areas for both sides
- Three rows: melee, ranged, siege
- Hand cards
- Total score and row score
- Round information
- Pass button
- Right-side keyword explanations and history log

However, the current interface feels closer to a functional debug prototype than a player-facing battle UI. Information exists, but it is not organized around the player’s core decisions. Since the game may later add a “strategy skill / leader skill” system, the interface should be cleaned up before complexity increases.

---

## 2. Current Issues

### 2.1 The current action state is not clear enough

Players cannot immediately tell:

- Is it my turn?
- What should I do now?
- Can I play a card?
- Should I pass this round?
- How far am I from winning this small round?

Recommendation: create a strong central battle status bar.

Suggested text:

```text
Round 1 / Best of 3
Your turn: Play a hand card or pass this small round
Current score: You 6 : 6 Opponent
```

### 2.2 “Round” terminology is ambiguous

A Gwent-like game contains several different concepts:

- The full match
- A small round within best-of-three
- The action turn where players alternate playing cards

Recommended terminology:

| Concept | Recommended Term |
|---|---|
| One round in best-of-three | Small Round |
| Each action cycle | Action Turn |
| Stop playing in this small round | Pass This Small Round / PASS |

Avoid “pass this turn”, because players may misunderstand it as skipping only one action.

### 2.3 Score information is too scattered

The current layout spreads scores, hand count, deck count, and row scores across multiple areas. Players need to scan too much.

Recommended central status bar:

```text
Round 1｜Your Turn｜You 6 : 6 Opponent｜Opponent Hand 9｜Your Hand 9
```

Information priority:

1. Current score
2. Active player
3. Small round progress
4. Hand count
5. Pass status

### 2.4 The battlefield looks too much like a table

The current three-row layout is functional but lacks battlefield feeling. The mirrored row order may also confuse new players.

Recommended battlefield model:

```text
Opponent Back Row: Siege
Opponent Mid Row: Ranged
Opponent Front Row: Melee

======== Battle Line ========

Your Front Row: Melee
Your Mid Row: Ranged
Your Back Row: Siege
```

Use visual separators, row labels, and background hierarchy to strengthen the sense of confrontation.

### 2.5 The right panel takes too much space

The current right panel shows:

- Keyword explanations
- History log

Keyword explanations are useful, but they should not permanently occupy a large part of the combat screen.

During battle, more important information includes:

- Selected card details
- Available targets
- Enemy mechanics
- Recent action log
- Strategy skill status

Recommendation: change the right panel into a dynamic panel.

Default state:

```text
Enemy mechanic
Recent actions
Small round hint
```

When a card is selected:

```text
Card details
Playable rows
Available targets
Keyword explanations
```

### 2.6 Hand card feedback is not strong enough

Players need to understand:

- Is this card playable?
- Which row can it be played to?
- Does it require a target?
- What is the expected value?
- Is the play risky?

Recommended hand card states:

| State | Visual Behavior |
|---|---|
| Playable | Normal highlight |
| Unplayable | Grayed out |
| Hover / long press | Enlarged card detail |
| Selected | Strong border highlight |
| Requires target | Highlight targetable units |
| Recommended play | Subtle hint |
| Risky play | Warning text |

After selecting a card, playable rows should be highlighted and invalid areas should be dimmed.

### 2.7 The Pass button wording is unclear

Current wording should be changed to:

```text
Pass This Small Round / PASS
```

Suggested confirmation:

```text
Confirm pass?
After passing, you cannot play more cards in this small round.
```

If the player is ahead:

```text
You are currently ahead by 6 points. After passing, the opponent can still continue playing.
```

If the player is behind:

```text
You are currently behind by 4 points. Passing will likely lose this small round, but you will preserve cards for the next one.
```

### 2.8 The history log is not useful enough for review

Current logs only show who played which card. They should include effects and score changes.

Example:

```text
You: Qin Infantry +6 → Your total score 6
Opponent: Chu Herald +3, summoned Chu Shaman +3 → Opponent total score 6
```

Suggested log structure:

```text
Actor:
Card name:
Base value:
Triggered effects:
Affected area:
Score change:
```

### 2.9 Enemy mechanics are not visible enough

In PVE, enemies should not just be “another deck”. Each enemy should have a clear mechanic.

Example:

```text
Enemy: Chu Herald
Style: Summon swarm
Passive: Every third card summons a soldier
Counterplay: Keep AOE or win the first two rounds quickly
```

Enemy mechanics should be more visible than generic keyword explanations.

### 2.10 Future strategy skills will increase complexity

If the game later adds leader-skill-like mechanics, the UI needs to show:

- Faction / leader avatar
- Skill name
- Skill effect
- Availability
- Remaining uses
- Target requirement
- Used state

Recommendation: reserve UI space now, but do not add a complex skill system in the first version.

---

## 3. Optimization Goals

1. Make the battle state readable at a glance.
2. Make the current action clear.
3. Show where a selected card can be played.
4. Clarify the meaning of Pass.
5. Turn the right panel into a dynamic assistance panel.
6. Reserve space for future strategy / leader skills.
7. Prepare for WeChat and iOS mobile adaptation.
8. Keep the Web prototype easy to iterate.

---

## 4. Recommended Desktop Layout

```text
┌────────────────────────────────────────────────────────────┐
│ Top: Opponent info / round score / settings                 │
│ Opponent: Chu｜Hand 9｜Deck 15｜Strategy: Summon 1/1         │
├────────────────────────────────────────────────────────────┤
│ Opponent Siege Row                               Row Score 0 │
│ Opponent Ranged Row                              Row Score 3 │
│ Opponent Melee Row                               Row Score 3 │
├────────────────────────────────────────────────────────────┤
│ Round 1 / Best of 3｜Your Turn｜You 6 : 6 Opponent           │
│ Hint: Play a card from your hand or pass this small round    │
├────────────────────────────────────────────────────────────┤
│ Your Melee Row                                   Row Score 6 │
│ Your Ranged Row                                  Row Score 0 │
│ Your Siege Row                                   Row Score 0 │
├────────────────────────────────────────────────────────────┤
│ You: Qin｜Hand 9｜Deck 15｜Strategy: Tiger & Wolf 1/1         │
├────────────────────────────────────────────────────────────┤
│ Hand: [Card][Card][Card][Card][Card][Card][Card][Card]       │
│ Right: Strategy Skill Button / Pass Button                   │
└────────────────────────────────────────────────────────────┘

Right dynamic panel:
- Default: enemy mechanic + recent actions
- Card selected: card details + available targets + keyword explanations
```

---

## 5. Suggested Wireframes

### 5.1 Desktop Landscape Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔵 Chu Chancellor｜Enemy Strategy: Summon 1/1｜Hand 9｜Deck 15       Settings │
│                              Opponent 6 : 6 You                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Siege   [   ] [   ] [   ]                                          0         │
│ Ranged  [Chu Herald 3] [Chu Shaman 3]                              3         │
│ Melee   [   ]                                                      3         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Round 1 / Best of 3｜Your turn: Play a hand card or pass this small round     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Melee   [Qin Infantry 6]                                          6          │
│ Ranged  [   ]                                                     0          │
│ Siege   [   ]                                                     0          │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔴 Qin｜Your Strategy: Tiger & Wolf 1/1｜Hand 9｜Deck 15                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Hand: [Wang Jian 8][Legalist Reform 4][Qin Archer 5][Shang Yang 4] ...        │
│                                  [Use Strategy] [Pass This Round / PASS]      │
└──────────────────────────────────────────────────────────────────────────────┘

Right Dynamic Panel:
┌────────────────────────────┐
│ Enemy Mechanic: Swarm       │
│ Every third card summons... │
├────────────────────────────┤
│ Recent Actions              │
│ 1. You: Qin Infantry +6     │
│ 2. Opponent: Chu Herald +3  │
│    Summoned Chu Shaman +3   │
└────────────────────────────┘
```

### 5.2 Card Selected State

```text
Player selects hand card: Qin Archer

Changes:
1. Qin Archer is highlighted.
2. Your ranged row is highlighted.
3. Invalid rows are dimmed.
4. Right dynamic panel shows card details.
```

Right panel:

```text
┌────────────────────────────┐
│ Qin Archer                  │
│ Power: 5                    │
│ Type: Unit / Ranged          │
│ Effect: Deal 2 damage        │
├────────────────────────────┤
│ Playable row: Your ranged    │
│ Target required: Yes         │
│ Valid targets: Enemy units   │
└────────────────────────────┘
```

### 5.3 Strategy Skill State

```text
Player clicks Strategy: Tiger & Wolf

If target is required:
- Your units are highlighted
- Right panel shows skill details
- Status bar says: Select a friendly unit to give it +3

If no target is required:
- Skill triggers immediately
- Skill button becomes disabled
- Log records: You used Tiger & Wolf. Qin Infantry +3.
```

---

## 6. Mobile Adaptation Challenges

### 6.1 Three rows are crowded in portrait mode

The current layout includes:

- Opponent three rows
- Your three rows
- Hand cards
- Score area
- Right panel
- Action log
- Strategy skill button

Directly moving this layout to portrait mode will be difficult.

Challenges:

- Cards become too small.
- Row height is insufficient.
- The right panel cannot remain visible.
- Horizontal hand scrolling may feel awkward.
- Target selection may cause misclicks.

### 6.2 The right panel must become a drawer or modal

Mobile should not keep a permanent right-side panel.

Recommended behavior:

```text
Tap card → bottom card detail drawer
Tap enemy avatar → enemy mechanic modal
Tap log button → recent action drawer
Tap keyword → keyword explanation popup
```

### 6.3 Hand interaction should be redesigned

Recommended mobile interaction:

```text
Tap card → preview / select
Tap again or tap highlighted row → play card
Long press card → view detail
Tap empty area → cancel selection
```

Avoid relying heavily on drag-and-drop in the first mobile version.

### 6.4 Pass requires anti-misclick design

The Pass button should be separated from normal hand actions and require confirmation.

Recommended layout:

```text
[Strategy 1/1]        [Pass This Small Round]
```

### 6.5 Landscape vs portrait

#### Option A: Mobile landscape

Pros:

- Better for three-row battlefield
- Easier to preserve Web layout
- More space for cards and rows

Cons:

- Users must rotate the phone
- WeChat mini-game adoption may be slightly harder
- Less lightweight for casual entry

#### Option B: Mobile portrait

Pros:

- More natural for WeChat users
- Faster to open and play
- Better for casual PVE

Cons:

- Three rows are cramped
- Right panel must be removed
- Hand cards and target selection are harder

Recommended strategy:

```text
Web prototype: keep landscape layout.
WeChat version: test whether landscape is acceptable.
If portrait is required, consider simplifying three rows into two rows.
```

---

## 7. Strategy / Leader Skill Recommendations

### 7.1 Reserve the slot first

Do not add a complex skill system immediately.

Recommended stages:

| Stage | Approach |
|---|---|
| Stage 1 | Reserve data structure and UI slot |
| Stage 2 | One simple skill per faction, once per match |
| Stage 3 | Add target selection and faction identity |
| Stage 4 | Balance based on battle data |

### 7.2 Recommended first-version rules

```text
One strategy skill per faction
Once per match
No cost
Simple effect
Some skills require a target
Button becomes disabled after use
```

Avoid in the first version:

```text
Reusable every turn
Cooldown system
Energy system
Complex combos
Heavy random effects
```

### 7.3 Strategy skill UI

Your player info:

```text
🔴 Qin｜Strategy: Tiger & Wolf 1/1｜Hand 9｜Deck 15
```

Bottom action buttons:

```text
[Strategy: Tiger & Wolf 1/1]
[Pass This Small Round / PASS]
```

Opponent info:

```text
🔵 Chu｜Strategy: Summon unused｜Hand 9｜Deck 15
```

---

## 8. Implementation Order

### Step 1: Fix terms and status bar

- Replace ambiguous “round” with “small round” and “action turn”.
- Rename pass button to “Pass This Small Round / PASS”.
- Add central status bar.

### Step 2: Rebuild the right panel

- Default: enemy mechanics + recent actions.
- Card selected: card details + available targets.
- Keyword explanations on demand.

### Step 3: Strengthen hand card interaction

- Add selected state.
- Highlight playable rows.
- Gray out invalid cards or areas.
- Highlight targetable units.

### Step 4: Improve battle logs

- Show triggered effects and score changes.
- Display the latest 5 actions.

### Step 5: Reserve strategy skill position

- Add skill field to player/faction model.
- Display skill button near player info.
- Keep it disabled or simple in the first version.

### Step 6: Prepare mobile design

- Decide landscape or portrait.
- If portrait, move detail/log/keyword explanations into drawers or modals.
- Consider reducing battlefield rows from three to two.

---

## 9. Implementation Notes for Codex / AI

```text
Issue 1: Rename battle terms
- Replace "round" display with "小局" and "行动轮"
- Rename pass button to "放弃本小局 / PASS"

Issue 2: Add central battle status bar
- Show current small round
- Show active side
- Show total score
- Show action hint

Issue 3: Convert right panel to dynamic panel
- Default: enemy mechanic + recent logs
- Card selected: card detail + available targets
- Keyword explanation on demand

Issue 4: Add card selection state
- Selected hand card highlight
- Playable rows highlight
- Invalid rows dimmed
- Targetable units highlighted

Issue 5: Improve action log
- Record score changes and triggered effects
- Show latest 5 actions

Issue 6: Reserve strategy skill slot
- Add strategy skill field to faction/player model
- Display strategy skill button near player info
- Disabled by default or simple once-per-match behavior

Issue 7: Add mobile layout notes
- Avoid hard dependency on right sidebar
- Prepare bottom drawer component for card detail/log/keyword explanation
```

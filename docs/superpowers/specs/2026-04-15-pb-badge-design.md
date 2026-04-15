# PB Badge — Design Spec
_Date: 2026-04-15_

## Overview

When a user completes all sets of an exercise at a weight higher than any previously recorded weight for that exercise+gym combination, a "PB!" badge appears on the exercise card. The badge stays visible for the rest of the session.

---

## Data

### New localStorage key
`pb__{exerciseName}__{gymIndex}`

```json
{ "weight_raw": 3, "weight_type": "plates" }
```

- Only ever updated upward (never decremented)
- Written the first time an exercise is completed (establishes the baseline)
- Gym-specific: PBs at Gym 1 and Gym 2 are tracked independently
- Type-specific: if `weight_type` differs between current and stored PB, skip comparison (no badge)

### New storage functions (storage.js)
- `getPB(exerciseName, gymIndex)` → `{ weight_raw, weight_type }` or `null`
- `setPB(exerciseName, gymIndex, data)` → writes to localStorage

---

## Logic

New function `checkPB(exercise, gymIndex)` called in `app.js` when `next.phase === 'done'`:

1. Read `weightData = getWeight(exercise.name, gymIndex)`
2. Read `pb = getPB(exercise.name, gymIndex)`
3. If no PB → save current as PB, show badge
4. If `weightData.weight_type !== pb.weight_type` → skip, no badge
5. If `weightData.weight_raw > pb.weight_raw` → update PB, show badge
6. Otherwise → no badge

---

## UI

- A `<span class="pb-badge">PB!</span>` is appended to the card's `.card-title` row when a PB is detected
- Color: `var(--amber)` (the rest-phase amber already in use)
- No animation — just appears
- Persists for the session; disappears on next day reset (cards are rebuilt on new day)

---

## Files Touched

| File | Change |
|------|--------|
| `storage.js` | Add `getPB` / `setPB` functions |
| `app.js` | Add `checkPB()`, call on `phase === 'done'`, inject `.pb-badge` into card DOM |
| `style.css` | Add `.pb-badge` style |

---

## Out of Scope

- Showing PB history or trends
- PB comparison across weight types (plates vs kg)
- PB notifications / sound
- Resetting PBs from within the app

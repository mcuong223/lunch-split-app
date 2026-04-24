# Lunch Split App — Product Spec

## 1. Overview

A shared web app for a small team to track daily group lunch expenses. One person pays the full bill each day; the app records who owes what and lets each person mark themselves as paid. No formal auth — access is controlled by a master key.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + TypeScript + Tailwind CSS |
| Backend / DB | Supabase (Postgres) |
| Auth | None — master key stored in `localStorage` |
| Hosting | Vercel or Netlify (static frontend) |

---

## 3. Access Control

- On first visit (or if key not in `localStorage`), show a **KeyGate screen** — a centered input asking for the master key.
- On submit, validate key against a hardcoded env variable (`VITE_MASTER_KEY`).
- If correct → save to `localStorage` as `lunchapp_key` → redirect to main app.
- If incorrect → show error, do not proceed.
- On subsequent visits, read from `localStorage` — skip KeyGate if key is present and valid.
- No user accounts, no per-user permissions. Anyone with the key can do everything.

---

## 4. Database Schema

### Table: `meals`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | NOT NULL | Auto-generated — see naming rule below |
| `date` | `date` | NOT NULL | Date of the meal |
| `payer_name` | `text` | NOT NULL | Name of person who paid the bill |
| `total_amount` | `numeric(10,2)` | NOT NULL | Total bill amount |
| `created_at` | `timestamptz` | default `now()` | |

**Meal naming rule:** Auto-generated on insert.
- Count existing meals for the same `date`.
- If count = 0 → name = `DD/MM/YYYY` (e.g. `24/04/2026`)
- If count ≥ 1 → name = `DD/MM/YYYY - 02`, `DD/MM/YYYY - 03`, etc.
- Frontend handles this logic before inserting.

---

### Table: `meal_participants`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `meal_id` | `uuid` | FK → `meals.id` ON DELETE CASCADE | |
| `name` | `text` | NOT NULL | Participant's name |
| `dish` | `text` | NULLABLE | Dish name (e.g. "Bún bò tái") |
| `amount_owed` | `numeric(10,2)` | NOT NULL | Amount this person owes the payer |
| `is_paid` | `boolean` | NOT NULL, default `false` | |
| `paid_at` | `timestamptz` | NULLABLE | Set when `is_paid` is toggled to `true` |

**Payer row rule:** The payer is also inserted as a participant with `is_paid = true` and `paid_at = now()` (they effectively owe themselves nothing, or `amount_owed = 0`).

---

### Supabase RLS Policy

Since there's no auth, use anon key with RLS:
- Enable RLS on both tables.
- Add policy: `USING (true)` for SELECT, INSERT, UPDATE, DELETE — open to all anon requests.
- Security relies entirely on the master key check on the frontend.

```sql
-- Example for meals table
CREATE POLICY "allow_all_anon" ON meals
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
```

---

### Migration SQL

```sql
-- meals
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  payer_name text NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- meal_participants
CREATE TABLE meal_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name text NOT NULL,
  dish text,
  amount_owed numeric(10,2) NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX ON meal_participants(meal_id);
CREATE INDEX ON meals(date);

-- RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_anon" ON meals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON meal_participants FOR ALL TO anon USING (true) WITH CHECK (true);
```

---

## 5. Application Structure

```
src/
├── main.tsx
├── App.tsx                  # Route: KeyGate or MainApp
├── lib/
│   └── supabase.ts          # Supabase client init
├── hooks/
│   ├── useMeals.ts          # Fetch meals by date
│   └── useParticipants.ts   # Fetch/mutate participants
├── components/
│   ├── KeyGate.tsx
│   ├── Header.tsx
│   ├── OverdueIndicator.tsx
│   ├── TodaySection.tsx
│   ├── MealCard.tsx
│   ├── ParticipantRow.tsx
│   ├── AddMealModal.tsx
│   └── HistorySection.tsx
└── types/
    └── index.ts             # Meal, MealParticipant types
```

---

## 6. UI & Feature Spec

### 6.1 KeyGate Screen

- Centered card with app name, a password input, and a Submit button.
- On correct key → save to `localStorage` → enter app.
- On wrong key → show inline error message.

---

### 6.2 Main Layout

```
[Header: App name | Today's date]
[OverdueIndicator — conditional]
[Today Section]
  [MealCard] x N  (one per meal today)
  [+ Add Meal button]
[History Section — collapsible]
```

---

### 6.3 OverdueIndicator

- Displayed as a **sticky banner or badge** near the top of the page.
- Trigger: any `meal_participants` row where `is_paid = false` AND the parent `meal.date < today`.
- Content: e.g. _"⚠️ 3 unpaid items from previous days"_ — clicking it scrolls/expands history.
- Hidden if all past meals are fully paid.

---

### 6.4 MealCard

Displays one meal. Shows:
- Meal name (auto-generated, e.g. `24/04/2026`)
- Payer name + total amount
- List of participants (ParticipantRow per person)
- Progress indicator: `3/5 paid` or similar

**Visual states:**
- Fully paid → card has a subtle green tint or ✅ badge
- Partially paid → normal
- All unpaid → no special state (just default)

---

### 6.5 ParticipantRow

Each row shows:
- Name
- Dish (italic, muted — if present)
- Amount owed (formatted: `50.000 ₫` or `50,000đ`)
- **Paid button / Paid badge**
  - If `is_paid = false` → show a `Mark Paid` button
  - If `is_paid = true` → show a green `✓ Paid` badge (non-interactive)
  - On click `Mark Paid` → optimistic UI update → call Supabase to set `is_paid = true`, `paid_at = now()`

**Payer row:** Show a special label like `👑 Paid (payer)` — no button needed.

---

### 6.6 Add Meal Modal / Form

Triggered by `+ Add Meal` button. Fields:

**Meal-level:**
- Payer name (text input or dropdown from recent names)
- Date (date picker, default today)
- Total amount (numeric input — informational, should equal sum of participants)

**Participants section (dynamic list):**
- `+ Add Person` button to add a row
- Each row: Name | Dish (optional) | Amount
- At least 1 participant required
- Validation: sum of `amount_owed` should equal `total_amount` — show a warning if they don't match (don't block submit)

**Submit behavior:**
1. Calculate meal `name` based on existing meals for that date
2. Insert into `meals`
3. Insert all participants into `meal_participants` (payer row with `is_paid = true`, `amount_owed = 0`)
4. Close modal, refresh today's meal list

---

### 6.7 History Section

- Collapsible accordion below Today Section
- Groups meals by date (descending)
- Each group shows MealCards just like Today Section
- Dates with any unpaid rows get a small ⚠️ indicator next to the date label

---

## 7. Data & Business Logic

### 7.1 Meal Name Generation

```typescript
async function generateMealName(date: string): Promise<string> {
  const { count } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })
    .eq('date', date);

  const [year, month, day] = date.split('-');
  const label = `${day}/${month}/${year}`;

  if (!count || count === 0) return label;
  return `${label} - ${String(count + 1).padStart(2, '0')}`;
}
```

### 7.2 Mark Paid

```typescript
async function markPaid(participantId: string) {
  await supabase
    .from('meal_participants')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('id', participantId);
}
```

### 7.3 Overdue Detection

```typescript
// Query: participants where is_paid = false AND meal.date < today
const today = new Date().toISOString().split('T')[0];

const { data } = await supabase
  .from('meal_participants')
  .select('id, meals!inner(date)')
  .eq('is_paid', false)
  .lt('meals.date', today);

const hasOverdue = data && data.length > 0;
```

---

## 8. Environment Variables

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_MASTER_KEY=your_secret_master_key
```

> ⚠️ `VITE_MASTER_KEY` is exposed in the client bundle. This is acceptable for a small internal tool — do not use this pattern for sensitive data.

---

## 9. Out of Scope (v1)

- User accounts / per-user login
- Push notifications for unpaid debts
- Debt simplification algorithm (A owes B, B owes C → A pays C directly)
- Edit or delete meal after creation
- Export to spreadsheet
- Mobile app

---

## 10. Nice-to-Have (post-v1)

- Autocomplete for participant names (from previous meals)
- Monthly summary view (total spent, who paid most)
- Edit meal / participant after creation
- Soft delete meals

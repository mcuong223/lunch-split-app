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

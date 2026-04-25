CREATE TABLE dishes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  latest_price numeric(10,2) NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON dishes(name);

ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_anon" ON dishes FOR ALL TO anon USING (true) WITH CHECK (true);

-- members table
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  momo_phone text,
  qr_image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON members(name);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_anon" ON members FOR ALL TO anon USING (true) WITH CHECK (true);

-- storage bucket for QR codes (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon read qr-codes" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'qr-codes');

CREATE POLICY "anon upload qr-codes" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'qr-codes');

CREATE POLICY "anon update qr-codes" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'qr-codes');

CREATE POLICY "anon delete qr-codes" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'qr-codes');

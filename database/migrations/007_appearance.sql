BEGIN;
CREATE TABLE marketplace_v2.appearance (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  theme text NOT NULL DEFAULT 'original' CHECK (theme IN ('original', 'christmas', 'new-year')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES marketplace_v2.users(id)
);
INSERT INTO marketplace_v2.appearance (id) VALUES (true);
ALTER TABLE marketplace_v2.appearance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketplace_v2.appearance FROM PUBLIC;
COMMIT;

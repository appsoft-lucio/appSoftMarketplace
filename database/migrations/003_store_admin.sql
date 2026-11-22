BEGIN;
CREATE TABLE marketplace_v2.store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES marketplace_v2.stores(id),
  actor_id uuid NOT NULL REFERENCES marketplace_v2.users(id),
  previous_status text NOT NULL CHECK (previous_status IN ('pending', 'approved', 'suspended')),
  new_status text NOT NULL CHECK (new_status IN ('approved', 'suspended')),
  reason text NOT NULL DEFAULT '' CHECK (length(reason) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (previous_status <> new_status),
  CHECK (new_status <> 'suspended' OR length(trim(reason)) >= 10)
);
CREATE INDEX store_reviews_history ON marketplace_v2.store_reviews(store_id, created_at DESC);
ALTER TABLE marketplace_v2.store_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketplace_v2.store_reviews FROM PUBLIC;
COMMIT;
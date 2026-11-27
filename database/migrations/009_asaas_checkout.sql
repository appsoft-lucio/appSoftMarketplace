BEGIN;

ALTER TABLE marketplace_v2.checkouts
  ADD COLUMN asaas_checkout_id uuid UNIQUE,
  ADD COLUMN asaas_expires_at timestamptz,
  ADD COLUMN asaas_status text CHECK (asaas_status IN ('creating', 'active', 'paid', 'closed', 'review'));

COMMIT;

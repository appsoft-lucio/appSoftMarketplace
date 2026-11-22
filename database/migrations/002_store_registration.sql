BEGIN;
ALTER TABLE marketplace_v2.stores
  ADD COLUMN phone text NOT NULL DEFAULT '',
  ADD COLUMN city text NOT NULL DEFAULT '',
  ADD COLUMN state text NOT NULL DEFAULT '';
ALTER TABLE marketplace_v2.stores
  ADD CONSTRAINT store_name_length CHECK (length(trim(name)) BETWEEN 3 AND 120),
  ADD CONSTRAINT store_slug_length CHECK (length(slug) BETWEEN 3 AND 64),
  ADD CONSTRAINT store_description_length CHECK (length(description) <= 1000);
COMMIT;
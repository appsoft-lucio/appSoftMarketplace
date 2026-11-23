BEGIN;
ALTER TABLE marketplace_v2.products
 ADD COLUMN promotion_price_cents integer CHECK (promotion_price_cents > 0 AND promotion_price_cents < price_cents),
 ADD COLUMN sku text NOT NULL DEFAULT '',
 ADD COLUMN brand text NOT NULL DEFAULT '',
 ADD COLUMN shipping_mode text NOT NULL DEFAULT 'arrange' CHECK (shipping_mode IN ('arrange','free','fixed','pickup')),
 ADD COLUMN shipping_price_cents integer,
 ADD COLUMN shipping_notes text NOT NULL DEFAULT '',
 ADD COLUMN delivery_days integer CHECK (delivery_days BETWEEN 1 AND 365),
 ADD COLUMN weight_grams integer CHECK (weight_grams BETWEEN 1 AND 1000000),
 ADD CONSTRAINT product_shipping_price CHECK ((shipping_mode = 'fixed' AND shipping_price_cents IS NOT NULL AND shipping_price_cents > 0) OR (shipping_mode <> 'fixed' AND shipping_price_cents IS NULL));
COMMIT;

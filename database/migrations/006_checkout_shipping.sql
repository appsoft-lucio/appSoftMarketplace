BEGIN;
CREATE TABLE marketplace_v2.store_shipping (
  store_id uuid PRIMARY KEY REFERENCES marketplace_v2.stores(id),
  delivery_enabled boolean NOT NULL DEFAULT false,
  pickup_enabled boolean NOT NULL DEFAULT false,
  delivery_scope text NOT NULL DEFAULT 'city' CHECK (delivery_scope IN ('city','state','country')),
  base_price_cents integer NOT NULL DEFAULT 0 CHECK (base_price_cents BETWEEN 0 AND 10000000),
  estimated_days integer NOT NULL DEFAULT 3 CHECK (estimated_days BETWEEN 0 AND 365),
  notes text NOT NULL DEFAULT '' CHECK (length(notes)<=1000)
);
ALTER TABLE marketplace_v2.store_shipping ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketplace_v2.store_shipping FROM PUBLIC;
ALTER TABLE marketplace_v2.checkouts
 ADD COLUMN request_hash text,
 ADD COLUMN expires_at timestamptz;
ALTER TABLE marketplace_v2.store_orders ADD COLUMN shipping_notes text NOT NULL DEFAULT '';
ALTER TABLE marketplace_v2.order_items ADD COLUMN variant_size text;
CREATE INDEX checkouts_expiration ON marketplace_v2.checkouts(expires_at) WHERE expires_at IS NOT NULL;

-- Locks and the status transition make expiry/cancellation safe to retry.
CREATE FUNCTION marketplace_v2.release_expired_orders() RETURNS integer
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE current_order record; item record; released integer:=0;
BEGIN
  FOR current_order IN
    SELECT o.id,o.store_id FROM marketplace_v2.store_orders o
    JOIN marketplace_v2.checkouts c ON c.id=o.checkout_id
    WHERE o.status='pending_payment' AND c.expires_at<=clock_timestamp()
    ORDER BY o.store_id,o.id FOR UPDATE OF o
  LOOP
    PERFORM 1 FROM marketplace_v2.stores WHERE id=current_order.store_id FOR UPDATE;
    FOR item IN SELECT * FROM marketplace_v2.order_items WHERE order_id=current_order.id ORDER BY product_id,variant_size
    LOOP
      IF item.variant_size IS NULL THEN
        UPDATE marketplace_v2.products SET stock=stock+item.quantity WHERE id=item.product_id;
      ELSE
        UPDATE marketplace_v2.product_variants SET stock=stock+item.quantity WHERE product_id=item.product_id AND size=item.variant_size;
        IF NOT FOUND THEN RAISE EXCEPTION 'Reserved variant missing'; END IF;
      END IF;
    END LOOP;
    UPDATE marketplace_v2.store_orders SET status='cancelled' WHERE id=current_order.id;
    INSERT INTO marketplace_v2.order_events(order_id,status,note) VALUES(current_order.id,'cancelled','Reserva encerrada; estoque devolvido.');
    released:=released+1;
  END LOOP;
  RETURN released;
END;
$$;
REVOKE ALL ON FUNCTION marketplace_v2.release_expired_orders() FROM PUBLIC;
COMMIT;

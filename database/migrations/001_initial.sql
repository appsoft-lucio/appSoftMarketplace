BEGIN;
CREATE SCHEMA marketplace_v2;

CREATE TABLE marketplace_v2.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text UNIQUE NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON marketplace_v2.users (lower(email));

CREATE TABLE marketplace_v2.plans (
  code text PRIMARY KEY,
  name text NOT NULL,
  monthly_price_cents integer NOT NULL CHECK (monthly_price_cents > 0),
  active_product_limit integer NOT NULL CHECK (active_product_limit > 0),
  enabled boolean NOT NULL DEFAULT true
);
INSERT INTO marketplace_v2.plans VALUES ('basic', 'Básico', 20000, 50, true);

CREATE TABLE marketplace_v2.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '',
  logo_url text,
  plan_code text NOT NULL DEFAULT 'basic' REFERENCES marketplace_v2.plans(code),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE marketplace_v2.store_members (
  store_id uuid NOT NULL REFERENCES marketplace_v2.stores(id),
  user_id uuid NOT NULL REFERENCES marketplace_v2.users(id),
  role text NOT NULL DEFAULT 'owner' CHECK (role = 'owner'),
  PRIMARY KEY (store_id, user_id)
);
CREATE INDEX store_members_user ON marketplace_v2.store_members(user_id);

CREATE TABLE marketplace_v2.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid UNIQUE NOT NULL REFERENCES marketplace_v2.stores(id),
  billing_months integer NOT NULL CHECK (billing_months IN (1, 3, 6, 12)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE marketplace_v2.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES marketplace_v2.subscriptions(id),
  plan_code text NOT NULL REFERENCES marketplace_v2.plans(code),
  billing_months integer NOT NULL CHECK (billing_months IN (1, 3, 6, 12)),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL CHECK (period_end > period_start),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  provider text,
  provider_payment_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id),
  CHECK (status <> 'paid' OR paid_at IS NOT NULL)
);

CREATE TABLE marketplace_v2.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL
);
CREATE TABLE marketplace_v2.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES marketplace_v2.stores(id),
  category_id uuid REFERENCES marketplace_v2.categories(id),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, store_id)
);
CREATE INDEX products_by_store ON marketplace_v2.products(store_id);
CREATE TABLE marketplace_v2.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES marketplace_v2.products(id),
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  UNIQUE (product_id, position)
);

-- Serializa ativações por loja para evitar exceder o plano em requisições concorrentes.
CREATE FUNCTION marketplace_v2.enforce_product_limit() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE product_limit integer;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.store_id <> OLD.store_id THEN
    RAISE EXCEPTION 'Não é permitido transferir produtos entre lojas';
  END IF;
  IF NEW.active THEN
    SELECT p.active_product_limit INTO product_limit
      FROM marketplace_v2.stores s JOIN marketplace_v2.plans p ON p.code = s.plan_code
      WHERE s.id = NEW.store_id FOR UPDATE OF s;
    IF (SELECT count(*) FROM marketplace_v2.products WHERE store_id = NEW.store_id AND active AND id <> NEW.id) >= product_limit THEN
      RAISE EXCEPTION 'Limite de produtos ativos atingido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER product_limit BEFORE INSERT OR UPDATE ON marketplace_v2.products
  FOR EACH ROW EXECUTE FUNCTION marketplace_v2.enforce_product_limit();

CREATE TABLE marketplace_v2.shipping_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES marketplace_v2.stores(id),
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  estimated_days integer NOT NULL CHECK (estimated_days >= 0),
  active boolean NOT NULL DEFAULT true,
  UNIQUE (id, store_id)
);
CREATE TABLE marketplace_v2.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid UNIQUE NOT NULL REFERENCES marketplace_v2.users(id)
);
CREATE TABLE marketplace_v2.cart_items (
  cart_id uuid NOT NULL REFERENCES marketplace_v2.carts(id),
  product_id uuid NOT NULL REFERENCES marketplace_v2.products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)
);

-- Uma compra agrupa pedidos independentes para cada loja.
CREATE TABLE marketplace_v2.checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES marketplace_v2.users(id),
  idempotency_key text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX checkouts_customer ON marketplace_v2.checkouts(customer_id);
CREATE TABLE marketplace_v2.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id uuid NOT NULL REFERENCES marketplace_v2.checkouts(id),
  store_id uuid NOT NULL REFERENCES marketplace_v2.stores(id),
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents integer NOT NULL CHECK (shipping_cents >= 0),
  total_cents integer GENERATED ALWAYS AS (subtotal_cents + shipping_cents) STORED,
  delivery_address jsonb NOT NULL CHECK (jsonb_typeof(delivery_address) = 'object'),
  shipping_name text NOT NULL,
  estimated_days integer NOT NULL CHECK (estimated_days >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checkout_id, store_id),
  UNIQUE (id, store_id)
);
CREATE INDEX orders_by_store ON marketplace_v2.store_orders(store_id, created_at DESC);
CREATE TABLE marketplace_v2.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal_cents integer GENERATED ALWAYS AS (unit_price_cents * quantity) STORED,
  FOREIGN KEY (order_id, store_id) REFERENCES marketplace_v2.store_orders(id, store_id),
  FOREIGN KEY (product_id, store_id) REFERENCES marketplace_v2.products(id, store_id)
);
CREATE INDEX order_items_order ON marketplace_v2.order_items(order_id);
CREATE TABLE marketplace_v2.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES marketplace_v2.store_orders(id),
  actor_id uuid REFERENCES marketplace_v2.users(id),
  status text NOT NULL CHECK (status IN ('pending_payment', 'processing', 'shipped', 'delivered', 'cancelled')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE marketplace_v2.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id uuid NOT NULL REFERENCES marketplace_v2.checkouts(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  provider text NOT NULL,
  provider_payment_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);
CREATE TABLE marketplace_v2.webhook_events (
  provider text NOT NULL,
  event_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  PRIMARY KEY (provider, event_id)
);

-- Segurança inicial: sem acesso direto pelas APIs públicas do Supabase.
DO $$ DECLARE item record;
BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname = 'marketplace_v2' LOOP
    EXECUTE format('ALTER TABLE marketplace_v2.%I ENABLE ROW LEVEL SECURITY', item.tablename);
  END LOOP;
END $$;
REVOKE ALL ON SCHEMA marketplace_v2 FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA marketplace_v2 FROM PUBLIC;

CREATE VIEW marketplace_v2.visible_stores WITH (security_invoker = true) AS
SELECT s.* FROM marketplace_v2.stores s
JOIN marketplace_v2.subscriptions sub ON sub.store_id = s.id
WHERE s.status = 'approved' AND sub.status = 'active'
  AND sub.starts_at <= now() AND sub.ends_at > now();
COMMIT;

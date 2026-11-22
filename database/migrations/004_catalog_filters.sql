BEGIN;
ALTER TABLE marketplace_v2.categories ADD COLUMN parent_id uuid REFERENCES marketplace_v2.categories(id);
ALTER TABLE marketplace_v2.categories ADD CONSTRAINT categories_not_own_parent CHECK (parent_id IS DISTINCT FROM id);
ALTER TABLE marketplace_v2.categories DROP CONSTRAINT categories_name_key;
ALTER TABLE marketplace_v2.categories ADD CONSTRAINT categories_parent_name UNIQUE NULLS NOT DISTINCT (parent_id, name);
CREATE INDEX categories_parent ON marketplace_v2.categories(parent_id);
CREATE FUNCTION marketplace_v2.prevent_category_cycle() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(58309215);
  IF NEW.parent_id IS NOT NULL AND EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id FROM marketplace_v2.categories WHERE id = NEW.parent_id
      UNION
      SELECT c.id, c.parent_id FROM marketplace_v2.categories c JOIN ancestors a ON a.parent_id = c.id
    ) SELECT 1 FROM ancestors WHERE id = NEW.id
  ) THEN RAISE EXCEPTION 'Uma categoria não pode ser descendente de si mesma'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER category_cycle BEFORE INSERT OR UPDATE OF parent_id ON marketplace_v2.categories
FOR EACH ROW EXECUTE FUNCTION marketplace_v2.prevent_category_cycle();
CREATE TABLE marketplace_v2.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES marketplace_v2.products(id),
  size text NOT NULL CHECK (length(trim(size)) BETWEEN 1 AND 20 AND size = trim(size)),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (product_id, size)
);
ALTER TABLE marketplace_v2.product_variants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketplace_v2.product_variants FROM PUBLIC;
CREATE INDEX variants_available_size ON marketplace_v2.product_variants(size, product_id) WHERE stock > 0;
CREATE INDEX products_category_price ON marketplace_v2.products(category_id, price_cents) WHERE active;

-- Taxonomia inicial; não cria produtos nem ativa lojas/assinaturas.
INSERT INTO marketplace_v2.categories (name, slug) VALUES
('Moda', 'moda'), ('Eletrônicos', 'eletronicos'), ('Casa e decoração', 'casa-decoracao'),
('Esporte e lazer', 'esporte-lazer'), ('Beleza e cuidados', 'beleza-cuidados');
INSERT INTO marketplace_v2.categories (name, slug, parent_id) SELECT v.name, v.slug, p.id
FROM (VALUES
('Feminino', 'moda-feminina', 'moda'), ('Masculino', 'moda-masculina', 'moda'), ('Calçados', 'calcados', 'moda'),
('Celulares', 'celulares', 'eletronicos'), ('Informática', 'informatica', 'eletronicos'), ('Acessórios', 'acessorios-eletronicos', 'eletronicos'),
('Cozinha', 'cozinha', 'casa-decoracao'), ('Decoração', 'decoracao', 'casa-decoracao'),
('Fitness', 'fitness', 'esporte-lazer'), ('Cuidados pessoais', 'cuidados-pessoais', 'beleza-cuidados')
) AS v(name, slug, parent_slug) JOIN marketplace_v2.categories p ON p.slug = v.parent_slug;
INSERT INTO marketplace_v2.categories (name, slug, parent_id) SELECT v.name, v.slug, p.id
FROM (VALUES ('Vestidos', 'vestidos', 'moda-feminina'), ('Camisetas', 'camisetas-femininas', 'moda-feminina'),
('Camisetas', 'camisetas-masculinas', 'moda-masculina'), ('Tênis', 'tenis', 'calcados'))
AS v(name, slug, parent_slug) JOIN marketplace_v2.categories p ON p.slug = v.parent_slug;
COMMIT;
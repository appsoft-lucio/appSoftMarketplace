import db from "../database.js";

const statements = {
  findAll: db.prepare(`
    SELECT p.*, u.name AS vendor_name
    FROM products p
    JOIN users u ON u.id = p.vendor_id
    WHERE p.active = 1
    ORDER BY p.created_at DESC
  `),
  findByVendor: db.prepare(`
    SELECT p.*, u.name AS vendor_name
    FROM products p
    JOIN users u ON u.id = p.vendor_id
    WHERE p.vendor_id = ?
    ORDER BY p.created_at DESC
  `),
  findById: db.prepare(`
    SELECT * FROM products WHERE id = ?
  `),
  create: db.prepare(`
    INSERT INTO products
      (vendor_id, name, description, price, category, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE products
    SET name = ?, description = ?, price = ?, category = ?, stock = ?,
        image_url = ?, active = ?
    WHERE id = ? AND vendor_id = ?
  `),
  remove: db.prepare(`
    UPDATE products SET active = 0
    WHERE id = ? AND vendor_id = ?
  `),
};

export const productRepository = {
  findAll: () => statements.findAll.all(),
  findByVendor: (vendorId) => statements.findByVendor.all(vendorId),
  findById: (id) => statements.findById.get(id),
  create: (product) => {
    const result = statements.create.run(
      product.vendorId,
      product.name,
      product.description,
      product.price,
      product.category,
      product.stock,
      product.imageUrl,
    );
    return statements.findById.get(result.lastInsertRowid);
  },
  update: (id, vendorId, product) => {
    const result = statements.update.run(
      product.name,
      product.description,
      product.price,
      product.category,
      product.stock,
      product.imageUrl,
      product.active,
      id,
      vendorId,
    );
    return result.changes > 0 ? statements.findById.get(id) : null;
  },
  remove: (id, vendorId) => {
    const result = statements.remove.run(id, vendorId);
    return result.changes > 0;
  },
};

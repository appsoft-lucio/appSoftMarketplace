import db from "../database.js";

const statements = {
  findByUser: db.prepare(`
    SELECT
      ci.product_id AS id,
      ci.quantity,
      p.name,
      p.description,
      p.price,
      p.category,
      p.stock,
      p.image_url,
      p.active,
      p.vendor_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? AND p.active = 1
    ORDER BY ci.updated_at DESC
  `),
  findItem: db.prepare(`
    SELECT * FROM cart_items
    WHERE user_id = ? AND product_id = ?
  `),
  add: db.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
  `),
  increment: db.prepare(`
    UPDATE cart_items
    SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND product_id = ?
  `),
  setQuantity: db.prepare(`
    UPDATE cart_items
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND product_id = ?
  `),
  remove: db.prepare(`
    DELETE FROM cart_items
    WHERE user_id = ? AND product_id = ?
  `),
  clear: db.prepare(`
    DELETE FROM cart_items WHERE user_id = ?
  `),
};

export const cartRepository = {
  findByUser: (userId) => statements.findByUser.all(userId),
  findItem: (userId, productId) => statements.findItem.get(userId, productId),
  add: (userId, productId, quantity) =>
    statements.add.run(userId, productId, quantity),
  increment: (userId, productId, quantity) =>
    statements.increment.run(quantity, userId, productId),
  setQuantity: (userId, productId, quantity) =>
    statements.setQuantity.run(quantity, userId, productId),
  remove: (userId, productId) =>
    statements.remove.run(userId, productId).changes > 0,
  clear: (userId) => statements.clear.run(userId).changes,
};

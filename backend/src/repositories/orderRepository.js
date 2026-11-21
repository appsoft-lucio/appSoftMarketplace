import db from "../database.js";

const statements = {
  findCart: db.prepare(`
    SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock,
           p.active, p.vendor_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `),
  insertOrder: db.prepare(`
    INSERT INTO orders (customer_id, subtotal, shipping, total, status)
    VALUES (?, ?, 25, ?, 'processando')
  `),
  insertItem: db.prepare(`
    INSERT INTO order_items
      (order_id, product_id, vendor_id, product_name, unit_price, quantity, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  decreaseStock: db.prepare(`
    UPDATE products
    SET stock = stock - ?
    WHERE id = ? AND stock >= ? AND active = 1
  `),
  clearCart: db.prepare(`DELETE FROM cart_items WHERE user_id = ?`),
  findById: db.prepare(`SELECT * FROM orders WHERE id = ?`),
  findItems: db.prepare(`
    SELECT * FROM order_items WHERE order_id = ? ORDER BY id
  `),
  findByCustomer: db.prepare(`
    SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC
  `),
  findByVendor: db.prepare(`
    SELECT DISTINCT o.*
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.vendor_id = ?
    ORDER BY o.created_at DESC
  `),
  updateStatus: db.prepare(`
    UPDATE orders
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
};

export const orderRepository = {
  createTransaction(customerId) {
    return db.transaction(() => {
      const cart = statements.findCart.all(customerId);
      if (cart.length === 0) {
        throw { status: 400, message: "O carrinho está vazio." };
      }

      for (const item of cart) {
        if (!item.active) {
          throw { status: 400, message: `Produto indisponível: ${item.name}` };
        }
        if (item.quantity > item.stock) {
          throw {
            status: 400,
            message: `Estoque insuficiente para: ${item.name}`,
          };
        }
      }

      const subtotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
      const orderResult = statements.insertOrder.run(
        customerId,
        subtotal,
        subtotal + 25,
      );
      const orderId = orderResult.lastInsertRowid;

      for (const item of cart) {
        statements.insertItem.run(
          orderId,
          item.product_id,
          item.vendor_id,
          item.name,
          item.price,
          item.quantity,
          item.price * item.quantity,
        );

        statements.decreaseStock.run(
          item.quantity,
          item.product_id,
          item.quantity,
        );
      }

      statements.clearCart.run(customerId);
      return this.getWithItems(orderId);
    })();
  },

  getWithItems(orderId) {
    const order = statements.findById.get(orderId);
    if (!order) return null;
    return { ...order, items: statements.findItems.all(orderId) };
  },

  findByCustomer(customerId) {
    return statements.findByCustomer.all(customerId).map((order) => ({
      ...order,
      items: statements.findItems.all(order.id),
    }));
  },

  findByVendor(vendorId) {
    return statements.findByVendor.all(vendorId).map((order) => ({
      ...order,
      items: statements.findItems.all(order.id).filter(
        (item) => item.vendor_id === vendorId,
      ),
    }));
  },

  belongsToVendor(orderId, vendorId) {
    return db.prepare(`
      SELECT 1 FROM order_items
      WHERE order_id = ? AND vendor_id = ?
      LIMIT 1
    `).get(orderId, vendorId);
  },

  updateStatus(orderId, status) {
    return statements.updateStatus.run(status, orderId).changes > 0;
  },
};

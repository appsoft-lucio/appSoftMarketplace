import db, { tables, transaction } from "../database.js";

async function withItems(order, client = db, vendorId) {
  const { rows: items } = await client.query(
    `SELECT * FROM ${tables.order_items} WHERE order_id = $1 ORDER BY id`,
    [order.id],
  );
  return {
    ...order,
    items:
      vendorId === undefined
        ? items
        : items.filter((item) => item.vendor_id === vendorId),
  };
}

export const orderRepository = {
  async createTransaction(customerId) {
    return transaction(async (client) => {
      // Serialize checkout and cart mutations for the same customer.
      await client.query(
        `SELECT id FROM ${tables.users} WHERE id = $1 FOR UPDATE`,
        [customerId],
      );
      // Lock products in a stable order so different buyers cannot oversell stock.
      const { rows: cart } = await client.query(
        `
        SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.active, p.vendor_id
        FROM ${tables.cart_items} ci JOIN ${tables.products} p ON p.id = ci.product_id
        WHERE ci.user_id = $1 ORDER BY p.id FOR UPDATE OF p, ci
      `,
        [customerId],
      );
      if (!cart.length)
        throw { status: 400, message: "O carrinho esta vazio." };
      for (const item of cart) {
        if (!item.active)
          throw { status: 400, message: `Produto indisponivel: ${item.name}` };
        if (item.quantity > item.stock)
          throw {
            status: 400,
            message: `Estoque insuficiente para: ${item.name}`,
          };
      }
      const subtotal = Number(
        cart
          .reduce((total, item) => total + item.price * item.quantity, 0)
          .toFixed(2),
      );
      const {
        rows: [order],
      } = await client.query(
        `INSERT INTO ${tables.orders} (customer_id, subtotal, shipping, total, status) VALUES ($1, $2, 25, $3, 'processando') RETURNING *`,
        [customerId, subtotal, subtotal + 25],
      );
      for (const item of cart) {
        await client.query(
          `INSERT INTO ${tables.order_items} (order_id, product_id, vendor_id, product_name, unit_price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order.id,
            item.product_id,
            item.vendor_id,
            item.name,
            item.price,
            item.quantity,
            item.price * item.quantity,
          ],
        );
        const result = await client.query(
          `UPDATE ${tables.products} SET stock = stock - $1 WHERE id = $2 AND stock >= $1 AND active = 1`,
          [item.quantity, item.product_id],
        );
        if (result.rowCount !== 1)
          throw {
            status: 400,
            message: `Estoque insuficiente para: ${item.name}`,
          };
      }
      await client.query(
        `DELETE FROM ${tables.cart_items} WHERE user_id = $1`,
        [customerId],
      );
      return withItems(order, client);
    });
  },
  async getWithItems(orderId) {
    const {
      rows: [order],
    } = await db.query(`SELECT * FROM ${tables.orders} WHERE id = $1`, [
      orderId,
    ]);
    return order ? withItems(order) : null;
  },
  async findByCustomer(customerId) {
    const { rows } = await db.query(
      `SELECT * FROM ${tables.orders} WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId],
    );
    return Promise.all(rows.map((order) => withItems(order)));
  },
  async findByVendor(vendorId) {
    const { rows } = await db.query(
      `SELECT DISTINCT o.* FROM ${tables.orders} o JOIN ${tables.order_items} oi ON oi.order_id = o.id WHERE oi.vendor_id = $1 ORDER BY o.created_at DESC`,
      [vendorId],
    );
    return Promise.all(rows.map((order) => withItems(order, db, vendorId)));
  },
  async belongsToVendor(orderId, vendorId) {
    return (
      (
        await db.query(
          `SELECT 1 FROM ${tables.order_items} WHERE order_id = $1 AND vendor_id = $2 LIMIT 1`,
          [orderId, vendorId],
        )
      ).rowCount > 0
    );
  },
  async updateStatus(orderId, status) {
    return (
      (
        await db.query(
          `UPDATE ${tables.orders} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [status, orderId],
        )
      ).rowCount > 0
    );
  },
};

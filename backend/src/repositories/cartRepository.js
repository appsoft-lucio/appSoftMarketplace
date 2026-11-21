import db, { tables, transaction } from "../database.js";

export const cartRepository = {
  async findByUser(userId) {
    return (
      await db.query(
        `SELECT ci.product_id AS id, ci.quantity, p.name, p.description, p.price, p.category, p.stock, p.image_url, p.active, p.vendor_id FROM ${tables.cart_items} ci JOIN ${tables.products} p ON p.id = ci.product_id WHERE ci.user_id = $1 AND p.active = 1 ORDER BY ci.updated_at DESC`,
        [userId],
      )
    ).rows;
  },
  async findItem(userId, productId) {
    return (
      await db.query(
        `SELECT * FROM ${tables.cart_items} WHERE user_id = $1 AND product_id = $2`,
        [userId, productId],
      )
    ).rows[0];
  },
  async setItem(userId, productId, quantity, increment = false) {
    return transaction(async (client) => {
      // Same lock order as checkout: customer first, then product.
      await client.query(
        `SELECT id FROM ${tables.users} WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      const {
        rows: [product],
      } = await client.query(
        `SELECT stock, active FROM ${tables.products} WHERE id = $1 FOR UPDATE`,
        [productId],
      );
      if (!product || product.active === 0)
        throw { status: 404, message: "Produto nao encontrado." };
      const {
        rows: [existing],
      } = await client.query(
        `SELECT quantity FROM ${tables.cart_items} WHERE user_id = $1 AND product_id = $2`,
        [userId, productId],
      );
      if (!increment && !existing)
        throw { status: 404, message: "Item nao esta no carrinho." };
      const next = quantity + (increment ? existing?.quantity || 0 : 0);
      if (next > product.stock)
        throw {
          status: 400,
          message: "Quantidade maior que o estoque disponivel.",
        };
      await client.query(
        `INSERT INTO ${tables.cart_items} (user_id, product_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP`,
        [userId, productId, next],
      );
    });
  },
  async remove(userId, productId) {
    return transaction(async (client) => {
      await client.query(
        `SELECT id FROM ${tables.users} WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      return (
        (
          await client.query(
            `DELETE FROM ${tables.cart_items} WHERE user_id = $1 AND product_id = $2`,
            [userId, productId],
          )
        ).rowCount > 0
      );
    });
  },
  async clear(userId) {
    return transaction(async (client) => {
      await client.query(
        `SELECT id FROM ${tables.users} WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      return (
        await client.query(
          `DELETE FROM ${tables.cart_items} WHERE user_id = $1`,
          [userId],
        )
      ).rowCount;
    });
  },
};

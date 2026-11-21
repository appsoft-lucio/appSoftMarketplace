import db, { tables } from "../database.js";

export const productRepository = {
  async findAll() {
    return (
      await db.query(
        `SELECT p.*, u.name AS vendor_name FROM ${tables.products} p JOIN ${tables.users} u ON u.id = p.vendor_id WHERE p.active = 1 ORDER BY p.created_at DESC`,
      )
    ).rows;
  },
  async findByVendor(vendorId) {
    return (
      await db.query(
        `SELECT p.*, u.name AS vendor_name FROM ${tables.products} p JOIN ${tables.users} u ON u.id = p.vendor_id WHERE p.vendor_id = $1 ORDER BY p.created_at DESC`,
        [vendorId],
      )
    ).rows;
  },
  async findById(id) {
    return (
      await db.query(`SELECT * FROM ${tables.products} WHERE id = $1`, [id])
    ).rows[0];
  },
  async create(p) {
    return (
      await db.query(
        `INSERT INTO ${tables.products} (vendor_id, name, description, price, category, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          p.vendorId,
          p.name,
          p.description,
          p.price,
          p.category,
          p.stock,
          p.imageUrl,
        ],
      )
    ).rows[0];
  },
  async update(id, vendorId, p) {
    return (
      (
        await db.query(
          `UPDATE ${tables.products} SET name = $1, description = $2, price = $3, category = $4, stock = $5, image_url = $6, active = $7 WHERE id = $8 AND vendor_id = $9 RETURNING *`,
          [
            p.name,
            p.description,
            p.price,
            p.category,
            p.stock,
            p.imageUrl,
            p.active,
            id,
            vendorId,
          ],
        )
      ).rows[0] || null
    );
  },
  async remove(id, vendorId) {
    return (
      (
        await db.query(
          `UPDATE ${tables.products} SET active = 0 WHERE id = $1 AND vendor_id = $2`,
          [id, vendorId],
        )
      ).rowCount > 0
    );
  },
};

import { DatabaseSync } from "node:sqlite";
import { tables, transaction } from "./database.js";

const columns = {
  users: ["id", "name", "email", "password_hash", "role", "created_at"],
  products: [
    "id",
    "vendor_id",
    "name",
    "description",
    "price",
    "category",
    "stock",
    "image_url",
    "active",
    "created_at",
  ],
  cart_items: [
    "id",
    "user_id",
    "product_id",
    "quantity",
    "created_at",
    "updated_at",
  ],
  orders: [
    "id",
    "customer_id",
    "subtotal",
    "shipping",
    "total",
    "status",
    "created_at",
    "updated_at",
  ],
  order_items: [
    "id",
    "order_id",
    "product_id",
    "vendor_id",
    "product_name",
    "unit_price",
    "quantity",
    "subtotal",
  ],
};

export async function importSqlite(path) {
  // Keep the source database intact, including its existing password hashes.
  const sqlite = new DatabaseSync(path, { readOnly: true });
  try {
    sqlite.exec("BEGIN");
    const snapshot = Object.fromEntries(
      Object.keys(columns).map((table) => [
        table,
        sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all(),
      ]),
    );
    sqlite.exec("COMMIT");
    return await transaction(async (client) => {
      await client.query(
        `LOCK TABLE ${Object.values(tables).join(", ")} IN ACCESS EXCLUSIVE MODE`,
      );
      for (const table of Object.keys(columns)) {
        const { rowCount } = await client.query(
          `SELECT 1 FROM ${tables[table]} LIMIT 1`,
        );
        if (rowCount)
          throw new Error("A importacao exige tabelas de destino vazias.");
      }
      for (const [table, names] of Object.entries(columns)) {
        for (const row of snapshot[table]) {
          const values = names.map((name) => {
            const value = row[name];
            // SQLite CURRENT_TIMESTAMP is UTC but carries no timezone suffix.
            return name.endsWith("_at") &&
              /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
              ? value.replace(" ", "T") + "Z"
              : value;
          });
          await client.query(
            `INSERT INTO ${tables[table]} (${names.join(", ")}) VALUES (${names.map((_, index) => `$${index + 1}`).join(", ")})`,
            values,
          );
        }
      }
      // Imported ids must not collide with the next generated id.
      for (const table of Object.keys(columns)) {
        const max = snapshot[table].at(-1)?.id;
        if (max)
          await client.query(
            "SELECT setval(pg_get_serial_sequence($1, 'id'), $2, true)",
            [tables[table], max],
          );
      }
      return Object.fromEntries(
        Object.entries(snapshot).map(([table, rows]) => [table, rows.length]),
      );
    });
  } finally {
    sqlite.close();
  }
}

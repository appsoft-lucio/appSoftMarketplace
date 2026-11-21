import db, { tables } from "../database.js";

export const userRepository = {
  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT id, name, email, password_hash, role FROM ${tables.users} WHERE email = $1`,
      [email],
    );
    return rows[0];
  },
  async findById(id) {
    const { rows } = await db.query(
      `SELECT id, name, email, role FROM ${tables.users} WHERE id = $1`,
      [id],
    );
    return rows[0];
  },
  async create({ name, email, passwordHash, role }) {
    try {
      const { rows } = await db.query(
        `INSERT INTO ${tables.users} (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
        [name, email, passwordHash, role],
      );
      return rows[0];
    } catch (error) {
      if (error.code === "23505")
        throw { status: 409, message: "Este e-mail ja esta cadastrado." };
      throw error;
    }
  },
};

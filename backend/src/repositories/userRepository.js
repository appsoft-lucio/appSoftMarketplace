import db from "../database.js";

const statements = {
  findByEmail: db.prepare(`
    SELECT id, name, email, password_hash, role
    FROM users
    WHERE email = ?
  `),
  findById: db.prepare(`
    SELECT id, name, email, role
    FROM users
    WHERE id = ?
  `),
  create: db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `),
};

export const userRepository = {
  findByEmail(email) {
    return statements.findByEmail.get(email);
  },

  findById(id) {
    return statements.findById.get(id);
  },

  create({ name, email, passwordHash, role }) {
    const result = statements.create.run(name, email, passwordHash, role);
    return {
      id: result.lastInsertRowid,
      name,
      email,
      role,
    };
  },
};

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("data/appsoft.db");

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer', 'vendor')) DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const demoUsers = [
  {
    name: "Cliente AppSoft",
    email: "cliente@appsoft.com",
    password: "123456",
    role: "customer",
  },
  {
    name: "Vendedor TechNova",
    email: "vendedor@appsoft.com",
    password: "123456",
    role: "vendor",
  },
];

const findUser = db.prepare("SELECT id FROM users WHERE email = ?");
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, role)
  VALUES (?, ?, ?, ?)
`);

for (const user of demoUsers) {
  if (!findUser.get(user.email)) {
    insertUser.run(
      user.name,
      user.email,
      bcrypt.hashSync(user.password, 10),
      user.role,
    );
  }
}

export default db;

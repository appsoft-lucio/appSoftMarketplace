import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/userRepository.js";

const jwtSecret = process.env.JWT_SECRET || "appsoft-development-secret";

function createToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: "7d" },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function validateCredentials({ name, email, password }) {
  if (!name || !email || !password) {
    throw { status: 400, message: "Preencha nome, e-mail e senha." };
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw { status: 400, message: "Informe um e-mail válido." };
  }

  if (password.length < 6) {
    throw {
      status: 400,
      message: "A senha deve ter ao menos 6 caracteres.",
    };
  }
}

export const authService = {
  register({ name, email, password, role }) {
    name = name?.trim();
    email = email?.trim().toLowerCase();
    role = role === "vendor" ? "vendor" : "customer";

    validateCredentials({ name, email, password });

    if (userRepository.findByEmail(email)) {
      throw { status: 409, message: "Este e-mail já está cadastrado." };
    }

    const user = userRepository.create({
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
    });

    return { user: publicUser(user), token: createToken(user) };
  },

  login({ email, password }) {
    email = email?.trim().toLowerCase();

    if (!email || !password) {
      throw { status: 400, message: "Informe e-mail e senha." };
    }

    const user = userRepository.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw { status: 401, message: "E-mail ou senha incorretos." };
    }

    return { user: publicUser(user), token: createToken(user) };
  },

  getAuthenticatedUser(userId) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "Usuário não encontrado." };
    }

    return user;
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, jwtSecret);
    } catch {
      throw { status: 401, message: "Sessão inválida ou expirada." };
    }
  },
};

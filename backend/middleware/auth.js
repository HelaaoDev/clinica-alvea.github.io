/**
 * Clínica Alvea - Middleware de autenticação
 *
 * Verifica se a requisição possui um token JWT válido no header
 * Authorization (formato: "Bearer <token>"). Se válido, anexa os
 * dados do usuário decodificados em req.usuario.
 */

const jwt = require("jsonwebtoken");
require("dotenv").config();

function auth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não informado. Faça login novamente." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, nome, role }
    next();
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido ou expirado. Faça login novamente." });
  }
}

module.exports = auth;

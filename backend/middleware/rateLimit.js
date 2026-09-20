/**
 * Clínica Alvea - Rate limiting
 *
 * Limita tentativas de login e cadastro por IP, mitigando ataques de
 * força bruta e abuso automatizado (bots). Usa express-rate-limit,
 * que não exige nenhum serviço externo/conta paga.
 */

const rateLimit = require("express-rate-limit");

// Login: no máximo 10 tentativas a cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." },
});

// Cadastro: no máximo 5 novas contas a cada hora por IP (evita criação em massa por bots)
const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de cadastro deste endereço. Tente novamente mais tarde." },
});

// Geral: limite amplo para toda a API, proteção básica contra varredura/DoS simples
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas requisições. Tente novamente em instantes." },
});

module.exports = { loginLimiter, registroLimiter, apiLimiter };

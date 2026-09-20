/**
 * Clínica Alvea - Rotas de contato corporativo (Plano Corporativo)
 *
 * POST /contato/corporativo - pública, envia solicitação de contato de uma empresa
 * (rotas de listagem/gestão ficam em routes/admin.js, protegidas por auth+isAdmin)
 */

const express = require("express");

const supabase = require("../utils/supabaseClient");
const { ehStringValida, ehEmailValido, sanitizarTexto } = require("../utils/validacao");
const { registroLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// POST /contato/corporativo
router.post("/corporativo", registroLimiter, async (req, res) => {
  const { nomeEmpresa, cnpj, responsavel, email, telefone, numeroColaboradores, mensagem, website } = req.body;

  // Honeypot anti-bot: campo invisível no formulário; se vier preenchido,
  // fingimos sucesso sem registrar nada de verdade.
  if (website) {
    return res.status(201).json({ mensagem: "Solicitação enviada com sucesso." });
  }

  if (!ehStringValida(nomeEmpresa, { min: 2, max: 150 })) {
    return res.status(400).json({ erro: "Informe o nome da empresa (2 a 150 caracteres)." });
  }
  if (!ehStringValida(responsavel, { min: 2, max: 150 })) {
    return res.status(400).json({ erro: "Informe o nome do responsável (2 a 150 caracteres)." });
  }
  if (!ehEmailValido(email)) {
    return res.status(400).json({ erro: "Informe um e-mail válido." });
  }
  if (!ehStringValida(telefone, { min: 8, max: 20 })) {
    return res.status(400).json({ erro: "Informe um telefone válido." });
  }
  if (mensagem && !ehStringValida(mensagem, { min: 0, max: 2000 })) {
    return res.status(400).json({ erro: "Mensagem muito longa (máximo 2000 caracteres)." });
  }

  const { error } = await supabase.from("contatos_corporativos").insert({
    nome_empresa: sanitizarTexto(nomeEmpresa),
    cnpj: cnpj ? sanitizarTexto(cnpj) : null,
    responsavel: sanitizarTexto(responsavel),
    email: String(email).trim().toLowerCase(),
    telefone: sanitizarTexto(telefone),
    numero_colaboradores: numeroColaboradores ? sanitizarTexto(numeroColaboradores) : null,
    mensagem: mensagem ? sanitizarTexto(mensagem) : null,
    status: "novo",
  });

  if (error) {
    console.error("[contato/corporativo] erro ao registrar:", error.message);
    return res.status(500).json({ erro: "Não foi possível enviar sua solicitação. Tente novamente." });
  }

  res.status(201).json({ mensagem: "Solicitação enviada com sucesso. Nossa equipe entrará em contato em breve." });
});

module.exports = router;

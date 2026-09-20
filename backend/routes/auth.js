/**
 * Clínica Alvea - Rotas de autenticação e perfil
 * POST /auth/registrar
 * POST /auth/login
 * GET  /auth/perfil          (autenticado)
 * PUT  /auth/perfil          (autenticado)
 * PUT  /auth/senha           (autenticado)
 * POST /auth/foto-perfil     (autenticado, multipart)
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const supabase = require("../utils/supabaseClient");
const { mapUsuario } = require("../utils/mappers");
const { uploadFotoPerfil } = require("../utils/upload");
const { criptografar, descriptografar } = require("../utils/crypto");
const { loginLimiter, registroLimiter } = require("../middleware/rateLimit");
const auth = require("../middleware/auth");

const router = express.Router();

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

function usuarioPublico(usuario) {
  const { senhaHash, ...resto } = usuario;
  return {
    ...resto,
    cpf: descriptografar(resto.cpf),
  };
}

// POST /auth/registrar - cadastro público (sempre como role "paciente")
router.post("/registrar", registroLimiter, async (req, res) => {
  const { nome, cpf, email, senha, website } = req.body;

  // Honeypot anti-bot: campo invisível no formulário que só um bot preencheria.
  // Se vier preenchido, respondemos como se fosse sucesso (sem criar nada de
  // verdade) para não revelar ao bot que foi detectado.
  if (website) {
    return res.status(201).json({ usuario: null, token: null });
  }

  if (!nome || !cpf || !email || !senha) {
    return res.status(400).json({ erro: "Preencha nome, CPF, email e senha." });
  }

  const cpfLimpo = String(cpf).replace(/\D/g, "");
  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ erro: "Informe um CPF válido (11 dígitos)." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: "Informe um e-mail válido." });
  }

  if (String(senha).length < 6) {
    return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });
  }

  const emailNormalizado = String(email).trim().toLowerCase();

  // O CPF é criptografado com um IV aleatório a cada gravação (mesmo texto
  // gera ciphertexts diferentes), então não dá para checar duplicidade com
  // um simples WHERE — buscamos os CPFs existentes e decriptografamos para
  // comparar. Para o volume de pacientes de uma clínica isso é tranquilo.
  const { data: existentes, error: erroBusca } = await supabase
    .from("usuarios")
    .select("cpf, email");

  if (erroBusca) {
    console.error("[auth/registrar] erro ao consultar usuários:", erroBusca.message);
    return res.status(500).json({ erro: "Não foi possível concluir o cadastro. Tente novamente." });
  }

  const cpfJaExiste = existentes.some((u) => descriptografar(u.cpf) === cpf);
  const emailJaExiste = existentes.some((u) => u.email.toLowerCase() === emailNormalizado);

  if (cpfJaExiste) {
    return res.status(409).json({ erro: "Já existe um cadastro com este CPF." });
  }
  if (emailJaExiste) {
    return res.status(409).json({ erro: "Já existe um cadastro com este e-mail." });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const { data: novoUsuarioDb, error: erroInsercao } = await supabase
    .from("usuarios")
    .insert({
      nome: String(nome).trim(),
      cpf: criptografar(cpf),
      email: emailNormalizado,
      senha_hash: senhaHash,
      role: "paciente",
    })
    .select()
    .single();

  if (erroInsercao) {
    console.error("[auth/registrar] erro ao criar usuário:", erroInsercao.message);
    return res.status(500).json({ erro: "Não foi possível concluir o cadastro. Tente novamente." });
  }

  const novoUsuario = mapUsuario(novoUsuarioDb);
  const token = gerarToken(novoUsuario);

  return res.status(201).json({
    usuario: usuarioPublico(novoUsuario),
    token,
  });
});

// POST /auth/login - login por email + senha (paciente ou admin)
router.post("/login", loginLimiter, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe email e senha." });
  }

  if (typeof email !== "string" || typeof senha !== "string") {
    return res.status(400).json({ erro: "Dados inválidos." });
  }

  const { data: usuarioDb, error } = await supabase
    .from("usuarios")
    .select("*")
    .ilike("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("[auth/login] erro ao consultar usuário:", error.message);
    return res.status(500).json({ erro: "Não foi possível entrar. Tente novamente." });
  }

  if (!usuarioDb) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  const usuario = mapUsuario(usuarioDb);
  const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

  if (!senhaCorreta) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  const token = gerarToken(usuario);

  return res.json({
    usuario: usuarioPublico(usuario),
    token,
  });
});

// GET /auth/perfil - retorna os dados atualizados do usuário logado
router.get("/perfil", auth, async (req, res) => {
  const { data: usuarioDb, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", req.usuario.id)
    .maybeSingle();

  if (error) {
    console.error("[auth/perfil] erro ao consultar usuário:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar o perfil." });
  }
  if (!usuarioDb) {
    return res.status(404).json({ erro: "Usuário não encontrado." });
  }

  res.json(usuarioPublico(mapUsuario(usuarioDb)));
});

// PUT /auth/perfil - atualiza dados pessoais (não altera email, cpf ou senha)
router.put("/perfil", auth, async (req, res) => {
  const { nome, telefone, endereco, dataNascimento, genero } = req.body;

  if (nome !== undefined && !nome.trim()) {
    return res.status(400).json({ erro: "O nome não pode ficar em branco." });
  }

  const camposAtualizar = {
    ...(nome !== undefined && { nome: nome.trim() }),
    ...(telefone !== undefined && { telefone }),
    ...(endereco !== undefined && { endereco }),
    ...(dataNascimento !== undefined && { data_nascimento: dataNascimento || null }),
    ...(genero !== undefined && { genero }),
  };

  const { data: atualizadoDb, error } = await supabase
    .from("usuarios")
    .update(camposAtualizar)
    .eq("id", req.usuario.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[auth/perfil] erro ao atualizar usuário:", error.message);
    return res.status(500).json({ erro: "Não foi possível salvar as alterações." });
  }
  if (!atualizadoDb) {
    return res.status(404).json({ erro: "Usuário não encontrado." });
  }

  res.json(usuarioPublico(mapUsuario(atualizadoDb)));
});

// PUT /auth/senha - troca de senha (exige confirmação da senha atual)
router.put("/senha", auth, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: "Informe a senha atual e a nova senha." });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ erro: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  const { data: usuarioDb, error: erroBusca } = await supabase
    .from("usuarios")
    .select("id, senha_hash")
    .eq("id", req.usuario.id)
    .maybeSingle();

  if (erroBusca) {
    console.error("[auth/senha] erro ao consultar usuário:", erroBusca.message);
    return res.status(500).json({ erro: "Não foi possível trocar a senha." });
  }
  if (!usuarioDb) {
    return res.status(404).json({ erro: "Usuário não encontrado." });
  }

  const senhaCorreta = await bcrypt.compare(senhaAtual, usuarioDb.senha_hash);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: "Senha atual incorreta." });
  }

  const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

  const { error: erroUpdate } = await supabase
    .from("usuarios")
    .update({ senha_hash: novaSenhaHash })
    .eq("id", req.usuario.id);

  if (erroUpdate) {
    console.error("[auth/senha] erro ao atualizar senha:", erroUpdate.message);
    return res.status(500).json({ erro: "Não foi possível trocar a senha." });
  }

  res.json({ mensagem: "Senha alterada com sucesso." });
});

// POST /auth/foto-perfil - upload da foto de perfil (multipart/form-data, campo "foto")
router.post("/foto-perfil", auth, (req, res) => {
  uploadFotoPerfil.single("foto")(req, res, async (erro) => {
    if (erro) {
      return res.status(400).json({ erro: erro.message });
    }
    if (!req.file) {
      return res.status(400).json({ erro: "Envie um arquivo de imagem no campo 'foto'." });
    }

    const { data: usuarioDb, error: erroBusca } = await supabase
      .from("usuarios")
      .select("foto_url")
      .eq("id", req.usuario.id)
      .maybeSingle();

    if (erroBusca) {
      console.error("[auth/foto-perfil] erro ao consultar usuário:", erroBusca.message);
      return res.status(500).json({ erro: "Não foi possível salvar a foto." });
    }
    if (!usuarioDb) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    // Remove a foto antiga do disco, se existir
    if (usuarioDb.foto_url && usuarioDb.foto_url.startsWith("/uploads/")) {
      fs.unlink(path.join(__dirname, "..", usuarioDb.foto_url), () => {});
    }

    const novaFotoUrl = `/uploads/perfis/${req.file.filename}`;

    const { data: atualizadoDb, error: erroUpdate } = await supabase
      .from("usuarios")
      .update({ foto_url: novaFotoUrl })
      .eq("id", req.usuario.id)
      .select()
      .single();

    if (erroUpdate) {
      console.error("[auth/foto-perfil] erro ao atualizar usuário:", erroUpdate.message);
      return res.status(500).json({ erro: "Não foi possível salvar a foto." });
    }

    res.json(usuarioPublico(mapUsuario(atualizadoDb)));
  });
});

module.exports = router;

/**
 * Clínica Alvea - Rotas de familiares (paciente autenticado)
 * GET    /familiares      - lista os familiares do paciente logado
 * POST   /familiares      - cadastra um novo familiar
 * PUT    /familiares/:id  - atualiza um familiar (somente do próprio paciente)
 * DELETE /familiares/:id  - remove um familiar (somente do próprio paciente)
 */

const express = require("express");

const supabase = require("../utils/supabaseClient");
const { mapFamiliar } = require("../utils/mappers");
const { criptografar, descriptografar } = require("../utils/crypto");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

function familiarPublico(familiar) {
  return { ...familiar, cpf: descriptografar(familiar.cpf) };
}

function validarDados({ nome, parentesco, dataNascimento, cpf }) {
  if (!nome || !String(nome).trim()) {
    return "Informe o nome do familiar.";
  }
  if (!parentesco || !String(parentesco).trim()) {
    return "Informe o parentesco.";
  }
  if (cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
    return "Informe um CPF válido (000.000.000-00) ou deixe em branco.";
  }
  if (dataNascimento && Number.isNaN(Date.parse(dataNascimento))) {
    return "Informe uma data de nascimento válida.";
  }
  return null;
}

// GET /familiares
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("familiares")
    .select("*")
    .eq("paciente_id", req.usuario.id)
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("[familiares] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar os familiares." });
  }

  res.json(data.map(mapFamiliar).map(familiarPublico));
});

// POST /familiares
router.post("/", async (req, res) => {
  const { nome, parentesco, dataNascimento, cpf } = req.body;

  const erro = validarDados({ nome, parentesco, dataNascimento, cpf });
  if (erro) {
    return res.status(400).json({ erro });
  }

  const { data, error } = await supabase
    .from("familiares")
    .insert({
      paciente_id: req.usuario.id,
      nome: String(nome).trim(),
      parentesco: String(parentesco).trim(),
      data_nascimento: dataNascimento || null,
      cpf: cpf ? criptografar(cpf) : null,
    })
    .select()
    .single();

  if (error) {
    console.error("[familiares] erro ao criar:", error.message);
    return res.status(500).json({ erro: "Não foi possível cadastrar o familiar." });
  }

  res.status(201).json(familiarPublico(mapFamiliar(data)));
});

// PUT /familiares/:id
router.put("/:id", async (req, res) => {
  const { nome, parentesco, dataNascimento, cpf } = req.body;

  const erro = validarDados({ nome, parentesco, dataNascimento, cpf });
  if (erro) {
    return res.status(400).json({ erro });
  }

  const { data: familiarDb, error: erroBusca } = await supabase
    .from("familiares")
    .select("paciente_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (erroBusca) {
    console.error("[familiares] erro ao consultar:", erroBusca.message);
    return res.status(500).json({ erro: "Não foi possível salvar as alterações." });
  }
  if (!familiarDb) {
    return res.status(404).json({ erro: "Familiar não encontrado." });
  }
  if (familiarDb.paciente_id !== req.usuario.id) {
    return res.status(403).json({ erro: "Você só pode editar seus próprios familiares." });
  }

  const { data, error } = await supabase
    .from("familiares")
    .update({
      nome: String(nome).trim(),
      parentesco: String(parentesco).trim(),
      data_nascimento: dataNascimento || null,
      cpf: cpf ? criptografar(cpf) : null,
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    console.error("[familiares] erro ao atualizar:", error.message);
    return res.status(500).json({ erro: "Não foi possível salvar as alterações." });
  }

  res.json(familiarPublico(mapFamiliar(data)));
});

// DELETE /familiares/:id
router.delete("/:id", async (req, res) => {
  const { data: familiarDb, error: erroBusca } = await supabase
    .from("familiares")
    .select("paciente_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (erroBusca) {
    console.error("[familiares] erro ao consultar:", erroBusca.message);
    return res.status(500).json({ erro: "Não foi possível remover o familiar." });
  }
  if (!familiarDb) {
    return res.status(404).json({ erro: "Familiar não encontrado." });
  }
  if (familiarDb.paciente_id !== req.usuario.id) {
    return res.status(403).json({ erro: "Você só pode remover seus próprios familiares." });
  }

  const { error } = await supabase.from("familiares").delete().eq("id", req.params.id);

  if (error) {
    console.error("[familiares] erro ao remover:", error.message);
    return res.status(500).json({ erro: "Não foi possível remover o familiar." });
  }

  res.json({ mensagem: "Familiar removido com sucesso." });
});

module.exports = router;

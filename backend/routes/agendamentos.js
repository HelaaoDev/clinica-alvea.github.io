/**
 * Clínica Alvea - Rotas de agendamentos (paciente autenticado)
 * POST   /agendamentos          - cria agendamento (para o titular ou, opcionalmente, para um familiar)
 * GET    /agendamentos/meus     - lista agendamentos do paciente logado
 * DELETE /agendamentos/:id      - cancela agendamento (somente o próprio paciente)
 */

const express = require("express");

const supabase = require("../utils/supabaseClient");
const { mapProfissional, mapAgendamento, mapUsuario } = require("../utils/mappers");
const { notificarAgendamento } = require("../utils/notificacoes");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// POST /agendamentos
router.post("/", async (req, res) => {
  const { profissionalId, dataHora, canalNotificacao, familiarId } = req.body;

  if (!profissionalId || !dataHora) {
    return res.status(400).json({ erro: "Informe profissionalId e dataHora." });
  }

  let paraFamiliarId = null;
  let paraNome = null;

  if (familiarId) {
    const { data: familiarDb, error: erroFamiliar } = await supabase
      .from("familiares")
      .select("*")
      .eq("id", familiarId)
      .maybeSingle();

    if (erroFamiliar) {
      console.error("[agendamentos] erro ao consultar familiar:", erroFamiliar.message);
      return res.status(500).json({ erro: "Não foi possível criar o agendamento." });
    }
    if (!familiarDb || familiarDb.paciente_id !== req.usuario.id) {
      return res.status(403).json({ erro: "Familiar inválido para este agendamento." });
    }

    paraFamiliarId = familiarDb.id;
    paraNome = familiarDb.nome;
  }

  const { data: profissionalDb, error: erroProfissional } = await supabase
    .from("profissionais")
    .select("*")
    .eq("id", profissionalId)
    .maybeSingle();

  if (erroProfissional) {
    console.error("[agendamentos] erro ao consultar profissional:", erroProfissional.message);
    return res.status(500).json({ erro: "Não foi possível criar o agendamento." });
  }
  if (!profissionalDb) {
    return res.status(404).json({ erro: "Profissional não encontrado." });
  }

  const profissional = mapProfissional(profissionalDb);

  if (!profissional.horariosDisponiveis.includes(dataHora)) {
    return res.status(400).json({ erro: "Horário inválido para este profissional." });
  }

  const { data: conflitos, error: erroConflitos } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("profissional_id", profissionalId)
    .eq("data_hora", dataHora)
    .neq("status", "cancelado");

  if (erroConflitos) {
    console.error("[agendamentos] erro ao checar conflitos:", erroConflitos.message);
    return res.status(500).json({ erro: "Não foi possível criar o agendamento." });
  }
  if (conflitos.length > 0) {
    return res.status(409).json({ erro: "Este horário já foi reservado. Escolha outro." });
  }

  const { data: novoAgendamentoDb, error: erroInsercao } = await supabase
    .from("agendamentos")
    .insert({
      paciente_id: req.usuario.id,
      profissional_id: profissionalId,
      profissional_nome: profissional.nome,
      especialidade: profissional.especialidade,
      data_hora: dataHora,
      status: "confirmado",
      familiar_id: paraFamiliarId,
      para_nome: paraNome,
    })
    .select()
    .single();

  if (erroInsercao) {
    console.error("[agendamentos] erro ao criar agendamento:", erroInsercao.message);
    return res.status(500).json({ erro: "Não foi possível criar o agendamento." });
  }

  const novoAgendamento = mapAgendamento(novoAgendamentoDb);

  // Envio de notificação (email real / sms simulado) — nunca bloqueia a criação do agendamento
  let notificacao = null;
  try {
    const { data: usuarioDb } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", req.usuario.id)
      .maybeSingle();

    if (usuarioDb) {
      notificacao = await notificarAgendamento({
        usuario: mapUsuario(usuarioDb),
        agendamento: novoAgendamento,
        canal: canalNotificacao,
      });
    }
  } catch (erro) {
    console.error("[agendamentos] Falha ao notificar:", erro.message);
  }

  res.status(201).json({ ...novoAgendamento, notificacao });
});

// GET /agendamentos/meus
router.get("/meus", async (req, res) => {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("paciente_id", req.usuario.id)
    .order("data_hora", { ascending: true });

  if (error) {
    console.error("[agendamentos/meus] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar seus agendamentos." });
  }

  res.json(data.map(mapAgendamento));
});

// DELETE /agendamentos/:id
router.delete("/:id", async (req, res) => {
  const { data: agendamentoDb, error: erroBusca } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (erroBusca) {
    console.error("[agendamentos] erro ao consultar agendamento:", erroBusca.message);
    return res.status(500).json({ erro: "Não foi possível cancelar o agendamento." });
  }
  if (!agendamentoDb) {
    return res.status(404).json({ erro: "Agendamento não encontrado." });
  }

  const agendamento = mapAgendamento(agendamentoDb);

  if (agendamento.pacienteId !== req.usuario.id) {
    return res.status(403).json({ erro: "Você só pode cancelar seus próprios agendamentos." });
  }

  const { data: atualizadoDb, error: erroUpdate } = await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", req.params.id)
    .select()
    .single();

  if (erroUpdate) {
    console.error("[agendamentos] erro ao cancelar agendamento:", erroUpdate.message);
    return res.status(500).json({ erro: "Não foi possível cancelar o agendamento." });
  }

  res.json({ mensagem: "Agendamento cancelado com sucesso.", agendamento: mapAgendamento(atualizadoDb) });
});

module.exports = router;

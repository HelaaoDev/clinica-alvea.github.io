/**
 * Clínica Alvea - Rotas administrativas
 * Todas as rotas aqui exigem autenticação + role "admin".
 *
 * Profissionais:
 *   POST   /admin/profissionais
 *   PUT    /admin/profissionais/:id
 *   DELETE /admin/profissionais/:id
 *
 * Agendamentos:
 *   GET /admin/agendamentos
 *   PUT /admin/agendamentos/:id/status
 *
 * Exames:
 *   POST /admin/exames
 *   PUT  /admin/exames/:id/resultado   (aceita multipart/form-data com arquivo)
 *
 * Pacientes:
 *   GET    /admin/pacientes
 *   DELETE /admin/pacientes/:id        (exclusão definitiva + dados vinculados)
 *
 * Contatos corporativos:
 *   GET    /admin/contatos-corporativos
 *   PUT    /admin/contatos-corporativos/:id/status
 *   DELETE /admin/contatos-corporativos/:id
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const supabase = require("../utils/supabaseClient");
const {
  mapProfissional,
  mapAgendamento,
  mapExame,
  mapUsuario,
  mapContatoCorporativo,
} = require("../utils/mappers");
const { uploadExame } = require("../utils/upload");
const { descriptografar } = require("../utils/crypto");
const { ehStringValida, ehDataValida, ehArrayDeDataHorasValido, sanitizarTexto } = require("../utils/validacao");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

router.use(auth, isAdmin);

// Wrapper para capturar erros do multer (tamanho/tipo de arquivo) como JSON
function uploadExameMiddleware(req, res, next) {
  uploadExame.single("arquivo")(req, res, (erro) => {
    if (erro) {
      return res.status(400).json({ erro: erro.message });
    }
    next();
  });
}

// Soma 1 dia a uma data "AAAA-MM-DD" (para filtros de intervalo)
function proximoDia(dataIso) {
  const data = new Date(`${dataIso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + 1);
  return data.toISOString().slice(0, 10);
}

/* ---------------------- PROFISSIONAIS ---------------------- */

router.post("/profissionais", async (req, res) => {
  const { nome, especialidade, horariosDisponiveis } = req.body;

  if (!ehStringValida(nome, { min: 2, max: 150 })) {
    return res.status(400).json({ erro: "Informe um nome válido (2 a 150 caracteres)." });
  }
  if (!ehStringValida(especialidade, { min: 2, max: 100 })) {
    return res.status(400).json({ erro: "Informe uma especialidade válida (2 a 100 caracteres)." });
  }
  if (horariosDisponiveis !== undefined && !ehArrayDeDataHorasValido(horariosDisponiveis)) {
    return res.status(400).json({ erro: "horariosDisponiveis deve ser uma lista de datas no formato AAAA-MM-DDTHH:MM." });
  }

  const { data, error } = await supabase
    .from("profissionais")
    .insert({
      id: uuidv4(),
      nome: nome.trim(),
      especialidade: especialidade.trim(),
      horarios_disponiveis: Array.isArray(horariosDisponiveis) ? horariosDisponiveis : [],
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/profissionais] erro ao criar:", error.message);
    return res.status(500).json({ erro: "Não foi possível cadastrar o profissional." });
  }

  res.status(201).json(mapProfissional(data));
});

router.put("/profissionais/:id", async (req, res) => {
  const { nome, especialidade, horariosDisponiveis } = req.body;

  if (nome !== undefined && !ehStringValida(nome, { min: 2, max: 150 })) {
    return res.status(400).json({ erro: "Nome inválido (2 a 150 caracteres)." });
  }
  if (especialidade !== undefined && !ehStringValida(especialidade, { min: 2, max: 100 })) {
    return res.status(400).json({ erro: "Especialidade inválida (2 a 100 caracteres)." });
  }
  if (horariosDisponiveis !== undefined && !ehArrayDeDataHorasValido(horariosDisponiveis)) {
    return res.status(400).json({ erro: "horariosDisponiveis deve ser uma lista de datas no formato AAAA-MM-DDTHH:MM." });
  }

  const camposAtualizar = {
    ...(nome && { nome: nome.trim() }),
    ...(especialidade && { especialidade: especialidade.trim() }),
    ...(Array.isArray(horariosDisponiveis) && { horarios_disponiveis: horariosDisponiveis }),
  };

  const { data, error } = await supabase
    .from("profissionais")
    .update(camposAtualizar)
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[admin/profissionais] erro ao atualizar:", error.message);
    return res.status(500).json({ erro: "Não foi possível atualizar o profissional." });
  }
  if (!data) {
    return res.status(404).json({ erro: "Profissional não encontrado." });
  }

  res.json(mapProfissional(data));
});

router.delete("/profissionais/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("profissionais")
    .delete()
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[admin/profissionais] erro ao remover:", error.message);
    return res.status(500).json({ erro: "Não foi possível remover o profissional." });
  }
  if (!data) {
    return res.status(404).json({ erro: "Profissional não encontrado." });
  }

  res.json({ mensagem: "Profissional removido com sucesso." });
});

/* ---------------------- AGENDAMENTOS ---------------------- */

router.get("/agendamentos", async (req, res) => {
  const { status, profissionalId, data } = req.query;
  let consulta = supabase.from("agendamentos").select("*").order("data_hora", { ascending: true });

  if (status) consulta = consulta.eq("status", status);
  if (profissionalId) consulta = consulta.eq("profissional_id", profissionalId);
  if (data) consulta = consulta.gte("data_hora", `${data}T00:00:00`).lt("data_hora", `${proximoDia(data)}T00:00:00`);

  const { data: linhas, error } = await consulta;

  if (error) {
    console.error("[admin/agendamentos] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar os agendamentos." });
  }

  res.json(linhas.map(mapAgendamento));
});

router.put("/agendamentos/:id/status", async (req, res) => {
  const { status } = req.body;
  const statusValidos = ["confirmado", "concluido", "cancelado"];

  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({ erro: `Status inválido. Use um de: ${statusValidos.join(", ")}` });
  }

  const { data, error } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[admin/agendamentos] erro ao atualizar status:", error.message);
    return res.status(500).json({ erro: "Não foi possível atualizar o agendamento." });
  }
  if (!data) {
    return res.status(404).json({ erro: "Agendamento não encontrado." });
  }

  res.json(mapAgendamento(data));
});

/* ---------------------- EXAMES ---------------------- */

router.get("/exames", async (req, res) => {
  const { pacienteId, status } = req.query;
  let consulta = supabase.from("exames").select("*").order("data_realizacao", { ascending: false });

  if (pacienteId) consulta = consulta.eq("paciente_id", pacienteId);
  if (status) consulta = consulta.eq("status", status);

  const { data, error } = await consulta;

  if (error) {
    console.error("[admin/exames] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar os exames." });
  }

  res.json(data.map(mapExame));
});

router.post("/exames", async (req, res) => {
  const { agendamentoId, pacienteId, tipoExame, dataRealizacao } = req.body;

  if (!ehStringValida(pacienteId, { min: 1, max: 100 })) {
    return res.status(400).json({ erro: "Informe um pacienteId válido." });
  }
  if (!ehStringValida(tipoExame, { min: 2, max: 150 })) {
    return res.status(400).json({ erro: "Informe um tipo de exame válido (2 a 150 caracteres)." });
  }
  if (!ehDataValida(dataRealizacao)) {
    return res.status(400).json({ erro: "Informe uma data de realização válida (AAAA-MM-DD)." });
  }

  const { data: pacienteDb, error: erroPaciente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", pacienteId)
    .eq("role", "paciente")
    .maybeSingle();

  if (erroPaciente) {
    console.error("[admin/exames] erro ao consultar paciente:", erroPaciente.message);
    return res.status(500).json({ erro: "Não foi possível criar o exame." });
  }
  if (!pacienteDb) {
    return res.status(404).json({ erro: "Paciente não encontrado." });
  }

  const { data, error } = await supabase
    .from("exames")
    .insert({
      agendamento_id: agendamentoId || null,
      paciente_id: pacienteId,
      tipo_exame: tipoExame.trim(),
      data_realizacao: dataRealizacao,
      status: "aguardando_resultado",
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/exames] erro ao criar:", error.message);
    return res.status(500).json({ erro: "Não foi possível criar o exame." });
  }

  res.status(201).json(mapExame(data));
});

router.put("/exames/:id/resultado", uploadExameMiddleware, async (req, res) => {
  const { laudoTexto, arquivoUrl } = req.body;

  if (!ehStringValida(laudoTexto, { min: 3, max: 5000 })) {
    return res.status(400).json({ erro: "Informe um laudo válido (mínimo 3 caracteres)." });
  }
  if (arquivoUrl && (!ehStringValida(arquivoUrl, { min: 5, max: 1000 }) || !/^https?:\/\//.test(arquivoUrl))) {
    return res.status(400).json({ erro: "O link do arquivo deve ser uma URL válida (começando com http:// ou https://)." });
  }

  // Prioriza o arquivo enviado por upload; se não houver, aceita um link (arquivoUrl) como alternativa
  const arquivoFinal = req.file
    ? `/uploads/exames/${req.file.filename}`
    : (arquivoUrl || null);

  const { data, error } = await supabase
    .from("exames")
    .update({
      status: "concluido",
      laudo_texto: sanitizarTexto(laudoTexto),
      arquivo_url: arquivoFinal,
    })
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[admin/exames] erro ao lançar resultado:", error.message);
    return res.status(500).json({ erro: "Não foi possível salvar o resultado." });
  }
  if (!data) {
    return res.status(404).json({ erro: "Exame não encontrado." });
  }

  res.json(mapExame(data));
});

/* ---------------------- PACIENTES ---------------------- */

router.get("/pacientes", async (req, res) => {
  const { data, error } = await supabase.from("usuarios").select("*").eq("role", "paciente");

  if (error) {
    console.error("[admin/pacientes] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar os pacientes." });
  }

  const pacientes = data.map((linha) => {
    const { senhaHash, ...resto } = mapUsuario(linha);
    return { ...resto, cpf: descriptografar(resto.cpf) };
  });

  res.json(pacientes);
});

// DELETE /admin/pacientes/:id
// Exclusão definitiva do paciente e de todos os dados vinculados a ele
// (agendamentos, exames, notificações e foto de perfil), conforme
// política de retenção de dados da clínica. Agendamentos, exames e
// notificações são removidos automaticamente pelo banco (ON DELETE CASCADE
// no schema) — o backend só precisa apagar os arquivos físicos do disco
// e contar o que foi removido antes de excluir o registro do paciente.
router.delete("/pacientes/:id", async (req, res) => {
  const { id } = req.params;

  const { data: paciente, error: erroPaciente } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .eq("role", "paciente")
    .maybeSingle();

  if (erroPaciente) {
    console.error("[admin/pacientes] erro ao consultar paciente:", erroPaciente.message);
    return res.status(500).json({ erro: "Não foi possível excluir o paciente." });
  }
  if (!paciente) {
    return res.status(404).json({ erro: "Paciente não encontrado." });
  }

  const [{ data: agendamentos }, { data: exames }] = await Promise.all([
    supabase.from("agendamentos").select("id").eq("paciente_id", id),
    supabase.from("exames").select("arquivo_url").eq("paciente_id", id),
  ]);

  // Remove os arquivos de laudo do disco (o registro em si some com o CASCADE)
  (exames || []).forEach((exame) => {
    if (exame.arquivo_url && exame.arquivo_url.startsWith("/uploads/")) {
      fs.unlink(path.join(__dirname, "..", exame.arquivo_url), () => {});
    }
  });

  // Remove a foto de perfil em disco, se houver
  if (paciente.foto_url && paciente.foto_url.startsWith("/uploads/")) {
    fs.unlink(path.join(__dirname, "..", paciente.foto_url), () => {});
  }

  const { error: erroExclusao } = await supabase.from("usuarios").delete().eq("id", id);

  if (erroExclusao) {
    console.error("[admin/pacientes] erro ao excluir paciente:", erroExclusao.message);
    return res.status(500).json({ erro: "Não foi possível excluir o paciente." });
  }

  res.json({
    mensagem: "Paciente e todos os dados vinculados foram excluídos permanentemente.",
    agendamentosRemovidos: (agendamentos || []).length,
    examesRemovidos: (exames || []).length,
  });
});

/* ---------------------- CONTATOS CORPORATIVOS ---------------------- */

// GET /admin/contatos-corporativos - lista todas as solicitações recebidas
router.get("/contatos-corporativos", async (req, res) => {
  const { status } = req.query;
  let consulta = supabase.from("contatos_corporativos").select("*").order("criado_em", { ascending: false });

  if (status) consulta = consulta.eq("status", status);

  const { data, error } = await consulta;

  if (error) {
    console.error("[admin/contatos-corporativos] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar as solicitações." });
  }

  res.json(data.map(mapContatoCorporativo));
});

// PUT /admin/contatos-corporativos/:id/status - marca como "contatado" ou volta para "novo"
router.put("/contatos-corporativos/:id/status", async (req, res) => {
  const { status } = req.body;
  const statusValidos = ["novo", "contatado"];

  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({ erro: `Status inválido. Use um de: ${statusValidos.join(", ")}` });
  }

  const { data, error } = await supabase
    .from("contatos_corporativos")
    .update({ status })
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[admin/contatos-corporativos] erro ao atualizar:", error.message);
    return res.status(500).json({ erro: "Não foi possível atualizar a solicitação." });
  }
  if (!data) {
    return res.status(404).json({ erro: "Solicitação não encontrada." });
  }

  res.json(mapContatoCorporativo(data));
});

// DELETE /admin/contatos-corporativos/:id - remove uma solicitação
router.delete("/contatos-corporativos/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("contatos_corporativos")
    .delete()
    .eq("id", req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[admin/contatos-corporativos] erro ao remover:", error.message);
    return res.status(500).json({ erro: "Não foi possível remover a solicitação." });
  }
  if (!data) {
    return res.status(404).json({ erro: "Solicitação não encontrada." });
  }

  res.json({ mensagem: "Solicitação removida com sucesso." });
});

module.exports = router;

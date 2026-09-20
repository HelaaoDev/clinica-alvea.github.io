/**
 * Clínica Alvea - Rotas públicas de profissionais
 * GET /profissionais?especialidade=X
 * GET /profissionais/:id/horarios
 */

const express = require("express");
const supabase = require("../utils/supabaseClient");
const { mapProfissional } = require("../utils/mappers");

const router = express.Router();

router.get("/", async (req, res) => {
  const { especialidade } = req.query;
  let consulta = supabase.from("profissionais").select("*");

  if (especialidade) {
    consulta = consulta.ilike("especialidade", especialidade);
  }

  const { data, error } = await consulta;

  if (error) {
    console.error("[profissionais] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar os profissionais." });
  }

  res.json(data.map(mapProfissional));
});

router.get("/:id/horarios", async (req, res) => {
  const { data: profissionalDb, error: erroProfissional } = await supabase
    .from("profissionais")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (erroProfissional) {
    console.error("[profissionais/horarios] erro ao consultar profissional:", erroProfissional.message);
    return res.status(500).json({ erro: "Não foi possível carregar os horários." });
  }
  if (!profissionalDb) {
    return res.status(404).json({ erro: "Profissional não encontrado." });
  }

  const profissional = mapProfissional(profissionalDb);

  // Remove horários já ocupados por agendamentos ativos
  const { data: agendamentos, error: erroAgendamentos } = await supabase
    .from("agendamentos")
    .select("data_hora, status")
    .eq("profissional_id", profissional.id)
    .neq("status", "cancelado");

  if (erroAgendamentos) {
    console.error("[profissionais/horarios] erro ao consultar agendamentos:", erroAgendamentos.message);
    return res.status(500).json({ erro: "Não foi possível carregar os horários." });
  }

  const horariosOcupados = agendamentos.map((a) => a.data_hora);
  const horariosDisponiveis = profissional.horariosDisponiveis.filter(
    (h) => !horariosOcupados.some((ocupado) => new Date(ocupado).getTime() === new Date(h).getTime())
  );

  res.json({ profissionalId: profissional.id, horariosDisponiveis });
});

module.exports = router;

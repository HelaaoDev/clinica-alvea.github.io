/**
 * Clínica Alvea - Rota de especialidades
 * GET /especialidades - lista especialidades distintas a partir dos profissionais cadastrados
 */

const express = require("express");
const supabase = require("../utils/supabaseClient");

const router = express.Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("profissionais").select("especialidade");

  if (error) {
    console.error("[especialidades] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar as especialidades." });
  }

  const especialidades = [...new Set(data.map((p) => p.especialidade))];
  res.json(especialidades);
});

module.exports = router;

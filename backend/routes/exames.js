/**
 * Clínica Alvea - Rotas de exames e resultados (paciente autenticado)
 * GET /exames/meus  - lista exames do paciente logado
 * GET /exames/:id   - detalhe de um exame (somente do próprio paciente)
 */

const express = require("express");

const supabase = require("../utils/supabaseClient");
const { mapExame } = require("../utils/mappers");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// GET /exames/meus
router.get("/meus", async (req, res) => {
  const { data, error } = await supabase
    .from("exames")
    .select("*")
    .eq("paciente_id", req.usuario.id)
    .order("data_realizacao", { ascending: false });

  if (error) {
    console.error("[exames/meus] erro ao consultar:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar seus exames." });
  }

  res.json(data.map(mapExame));
});

// GET /exames/:id
router.get("/:id", async (req, res) => {
  const { data: exameDb, error } = await supabase
    .from("exames")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    console.error("[exames] erro ao consultar exame:", error.message);
    return res.status(500).json({ erro: "Não foi possível carregar o exame." });
  }
  if (!exameDb) {
    return res.status(404).json({ erro: "Exame não encontrado." });
  }

  const exame = mapExame(exameDb);

  if (exame.pacienteId !== req.usuario.id) {
    return res.status(403).json({ erro: "Você não tem acesso a este exame." });
  }

  res.json(exame);
});

module.exports = router;

/**
 * Clínica Alvea - Sistema de Agendamento
 * Servidor principal (Express)
 */

// Fixa o fuso horário do processo em UTC — o Supabase/Postgres interpreta
// e devolve datas em UTC por padrão, e os horários dos profissionais são
// guardados como strings sem fuso (ex: "2026-09-19T08:00"). Sem isso, o
// Node interpretaria essas strings no fuso horário local do servidor
// (que pode não ser UTC em produção), causando horários errados nas
// comparações feitas em JavaScript.
process.env.TZ = "UTC";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { apiLimiter } = require("./middleware/rateLimit");
const { garantirHorariosFuturos } = require("./utils/garantirHorarios");

const authRoutes = require("./routes/auth");
const especialidadesRoutes = require("./routes/especialidades");
const profissionaisRoutes = require("./routes/profissionais");
const agendamentosRoutes = require("./routes/agendamentos");
const familiaresRoutes = require("./routes/familiares");
const examesRoutes = require("./routes/exames");
const adminRoutes = require("./routes/admin");
const contatoRoutes = require("./routes/contato");

const app = express();
const PORT = process.env.PORT || 3000;

// Confia no cabeçalho X-Forwarded-* quando rodando atrás de um proxy/load
// balancer (Render, Railway, Heroku, Nginx...) — necessário para o
// redirecionamento HTTPS e o rate limiting funcionarem corretamente em produção.
app.set("trust proxy", 1);

// Força HTTPS em produção (não afeta o ambiente local de desenvolvimento/demo)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// Cabeçalhos de segurança HTTP (X-Content-Type-Options, X-Frame-Options,
// Referrer-Policy, etc.). CSP fica desativado aqui porque este servidor só
// responde JSON/arquivos — o HTML é servido por um servidor estático à
// parte (frontend/, porta 8080), então CSP não se aplica a este processo.
// crossOriginResourcePolicy fica "cross-origin" de propósito: o frontend
// (porta 8080) precisa poder carregar imagens/PDFs de /uploads servidos
// por este backend (porta 3000) — portas diferentes contam como origens
// diferentes para o navegador.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS restrito a uma lista de origens conhecidas — evita que qualquer
// site na internet possa chamar esta API diretamente do navegador.
// Configurável via ALLOWED_ORIGINS no .env (várias origens separadas por
// vírgula); sem essa variável, cai no padrão de desenvolvimento local
// (frontend servido em localhost:8080 ou 127.0.0.1:8080).
const origensPermitidas = (
  process.env.ALLOWED_ORIGINS || "http://localhost:8080,http://127.0.0.1:8080"
)
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Sem "origin" no cabeçalho = chamada de ferramenta (curl, Postman,
      // app mobile) ou mesma origem — não é um cenário de navegador cross-site,
      // então é liberado. Requisições de navegador sempre enviam "origin".
      if (!origin || origensPermitidas.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Origem não permitida pelo CORS."));
    },
  })
);

app.use(express.json());
app.use(apiLimiter);
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// Rota de teste / healthcheck
app.get("/", (req, res) => {
  res.json({
    clinica: "Clínica Alvea",
    sistema: "Sistema de Agendamento - Clínica de Saúde",
    status: "online",
  });
});

app.use("/auth", authRoutes);
app.use("/especialidades", especialidadesRoutes);
app.use("/profissionais", profissionaisRoutes);
app.use("/agendamentos", agendamentosRoutes);
app.use("/familiares", familiaresRoutes);
app.use("/exames", examesRoutes);
app.use("/admin", adminRoutes);
app.use("/contato", contatoRoutes);

// Tratamento de rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Tratador de erros global — garante resposta em JSON (nunca a página de
// erro HTML padrão do Express, que pode vazar detalhes internos) para
// erros não tratados nas rotas, incluindo bloqueios de CORS.
app.use((err, req, res, next) => {
  if (err && err.message === "Origem não permitida pelo CORS.") {
    return res.status(403).json({ erro: err.message });
  }

  console.error("[erro não tratado]", err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

// Garante que os horários de demonstração dos profissionais nunca fiquem
// no passado, independente de quanto tempo se passou desde o último uso.
// Roda antes do servidor aceitar conexões, para que a primeira requisição
// já encontre os dados corretos.
(async () => {
  try {
    await garantirHorariosFuturos();
  } catch (erro) {
    console.error("[seed] Falha inesperada ao checar horários:", erro.message);
  }

  app.listen(PORT, () => {
    console.log(`Clínica Alvea - servidor rodando em http://localhost:${PORT}`);
  });
})();

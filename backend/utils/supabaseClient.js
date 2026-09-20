/**
 * Clínica Alvea - Cliente Supabase
 *
 * O backend é o ÚNICO que fala com o Supabase — usando a SERVICE ROLE KEY,
 * que ignora Row Level Security e tem acesso total ao banco. Por isso essa
 * chave NUNCA pode ser exposta ao navegador nem versionada no Git (fica só
 * no .env, que está no .gitignore). Todo controle de acesso continua sendo
 * feito pelo Express (middleware de autenticação JWT + checagem de dono do
 * registro), exatamente como já funcionava com os arquivos JSON.
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[supabase] SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY não configurados no .env.\n" +
    "           Veja backend/.env.example e o README (seção 'Banco de dados') para o passo a passo."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = supabase;

/**
 * Clínica Alvea - Verificação rápida da conexão com o Supabase
 *
 * Rode com: node backend/scripts/testar-supabase.js
 * (a partir da pasta backend/, ou ajuste o caminho do require abaixo)
 *
 * Confere, em ordem:
 * 1. Se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env
 * 2. Se a conexão com o banco funciona
 * 3. Se as 7 tabelas do schema existem e têm os dados de exemplo
 */

process.env.TZ = "UTC";

const supabase = require("../utils/supabaseClient");

const TABELAS_ESPERADAS = [
  "usuarios",
  "profissionais",
  "familiares",
  "agendamentos",
  "exames",
  "notificacoes",
  "contatos_corporativos",
];

async function main() {
  console.log("Testando conexão com o Supabase...\n");
  let tudoOk = true;

  for (const tabela of TABELAS_ESPERADAS) {
    const { count, error } = await supabase
      .from(tabela)
      .select("*", { count: "exact", head: true });

    if (error) {
      tudoOk = false;
      console.log(`❌ Tabela "${tabela}": ${error.message}`);
    } else {
      console.log(`✅ Tabela "${tabela}": OK (${count} registro(s))`);
    }
  }

  console.log("");
  if (tudoOk) {
    console.log("Tudo certo! O backend já pode usar este projeto Supabase.");
  } else {
    console.log(
      "Encontrei problema(s) acima. Confira se:\n" +
      "  - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão corretos no .env\n" +
      "  - Você rodou backend/supabase/schema.sql no SQL Editor do Supabase\n" +
      "  - Está usando a chave 'service_role', não a 'anon public'"
    );
    process.exit(1);
  }
}

main();

/**
 * Clínica Alvea - Garantia de horários de demonstração sempre no futuro
 *
 * Problema que resolve: os horários de exemplo dos profissionais são
 * datas fixas no banco. Passado tempo suficiente, essas datas ficam no
 * passado e a tela de agendamento aparece vazia para quem for testar o
 * sistema — sem que ninguém tenha "quebrado" nada.
 *
 * Esta rotina roda automaticamente toda vez que o servidor sobe: para
 * cada profissional, remove horários já passados e, se sobrarem poucos
 * horários futuros, completa com novos horários gerados a partir da data
 * atual. Não mexe em horários que já estão no futuro (evita apagar slots
 * que o admin tenha cadastrado manualmente), e não afeta agendamentos já
 * criados (cada agendamento guarda sua própria data, independente da
 * lista de disponibilidade do profissional).
 */

const supabase = require("./supabaseClient");
const { mapProfissional } = require("./mappers");

const MINIMO_HORARIOS_FUTUROS = 4;
const HORAS_PADRAO = ["08:00", "09:00", "09:30", "10:00", "11:00", "14:00", "15:00", "15:30", "16:30"];

function ehDataFutura(isoString) {
  return new Date(isoString).getTime() > Date.now();
}

/**
 * Gera `quantidade` horários futuros para um profissional, distribuídos
 * nos próximos dias úteis (pula domingos), evitando repetir uma
 * combinação dia+hora que já exista na lista atual.
 */
function gerarHorariosFuturos(quantidade, jaExistentes, offsetProfissional) {
  const gerados = [];
  const existentesSet = new Set(jaExistentes);
  let diasAdiante = 1;
  let tentativas = 0;

  while (gerados.length < quantidade && tentativas < 60) {
    tentativas += 1;
    const data = new Date();
    data.setDate(data.getDate() + diasAdiante);

    // Pula domingo (0) — clínica não atende nesse dia
    if (data.getDay() === 0) {
      diasAdiante += 1;
      continue;
    }

    const indiceHora = (offsetProfissional + gerados.length) % HORAS_PADRAO.length;
    const hora = HORAS_PADRAO[indiceHora];
    const dataFormatada = data.toISOString().slice(0, 10); // AAAA-MM-DD
    const isoCompleto = `${dataFormatada}T${hora}`;

    if (!existentesSet.has(isoCompleto)) {
      gerados.push(isoCompleto);
      existentesSet.add(isoCompleto);
    }

    diasAdiante += 2; // espalha os horários ao longo de duas semanas
  }

  return gerados;
}

async function garantirHorariosFuturos() {
  const { data: linhas, error } = await supabase.from("profissionais").select("*");

  if (error) {
    console.error("[seed] Não foi possível consultar profissionais para checar horários:", error.message);
    return;
  }

  const profissionais = linhas.map(mapProfissional);

  for (let indice = 0; indice < profissionais.length; indice += 1) {
    const prof = profissionais[indice];
    const horariosAtuais = Array.isArray(prof.horariosDisponiveis) ? prof.horariosDisponiveis : [];
    const futuros = horariosAtuais.filter(ehDataFutura);

    let novaLista = futuros;
    let precisaAtualizar = futuros.length !== horariosAtuais.length;

    if (futuros.length < MINIMO_HORARIOS_FUTUROS) {
      const faltam = MINIMO_HORARIOS_FUTUROS - futuros.length;
      const novos = gerarHorariosFuturos(faltam, futuros, indice);
      if (novos.length) precisaAtualizar = true;
      novaLista = [...futuros, ...novos].sort();
    } else {
      novaLista = futuros.sort();
    }

    if (precisaAtualizar) {
      const { error: erroUpdate } = await supabase
        .from("profissionais")
        .update({ horarios_disponiveis: novaLista })
        .eq("id", prof.id);

      if (erroUpdate) {
        console.error(`[seed] Falha ao atualizar horários de ${prof.nome}:`, erroUpdate.message);
      }
    }
  }

  console.log("[seed] Horários de demonstração dos profissionais verificados (mantidos sempre no futuro).");
}

module.exports = { garantirHorariosFuturos };

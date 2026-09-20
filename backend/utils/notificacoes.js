/**
 * Clínica Alvea - Utilitário de notificações
 *
 * Registra todo envio de notificação (email ou SMS) na tabela `notificacoes`
 * do Supabase, servindo como log auditável e como base para exibir o
 * histórico no admin.
 *
 * - Email: envio REAL via utils/email.js (Nodemailer/Gmail), se configurado.
 * - SMS: envio SIMULADO (registrado no log, mas não disparado de verdade),
 *   já que exigiria uma conta paga em serviço de terceiros (Twilio, Zenvia etc).
 *   A estrutura já está pronta para plugar um provedor real no futuro —
 *   basta substituir a função `enviarSmsSimulado` por uma chamada de API real.
 */

const supabase = require("./supabaseClient");
const { mapNotificacao } = require("./mappers");
const { enviarEmail, templateConfirmacaoAgendamento, emailConfigurado } = require("./email");

async function registrarNotificacao(dados) {
  const { data, error } = await supabase
    .from("notificacoes")
    .insert({
      canal: dados.canal,
      destinatario: dados.destinatario,
      paciente_id: dados.pacienteId,
      agendamento_id: dados.agendamentoId,
      tipo: dados.tipo,
      simulado: dados.simulado,
      enviado: dados.enviado,
      erro: dados.erro || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[notificacoes] erro ao registrar notificação:", error.message);
    // Não interrompe o fluxo do agendamento por causa de um log que falhou
    return { ...dados, id: null, criadoEm: new Date().toISOString() };
  }

  return mapNotificacao(data);
}

async function enviarSmsSimulado({ telefone, mensagem }) {
  // Simulação: em produção, aqui entraria a chamada a uma API real (Twilio, Zenvia...)
  return { enviado: true, simulado: true };
}

/**
 * Envia (ou simula) a notificação de confirmação de agendamento
 * e registra o resultado no log de notificações.
 */
async function notificarAgendamento({ usuario, agendamento, canal }) {
  const canalFinal = canal === "sms" ? "sms" : "email";

  if (canalFinal === "email") {
    const html = templateConfirmacaoAgendamento({
      nomePaciente: usuario.nome,
      especialidade: agendamento.especialidade,
      profissionalNome: agendamento.profissionalNome,
      dataHora: agendamento.dataHora,
    });

    const resultado = await enviarEmail({
      destinatario: usuario.email,
      assunto: "Agendamento confirmado — Clínica Alvea",
      html,
    });

    return registrarNotificacao({
      canal: "email",
      destinatario: usuario.email,
      pacienteId: usuario.id,
      agendamentoId: agendamento.id,
      tipo: "confirmacao_agendamento",
      simulado: !emailConfigurado,
      enviado: resultado.enviado,
      erro: resultado.erro || null,
    });
  }

  // canal === "sms" (simulado)
  const telefone = usuario.telefone || "(não informado)";
  const resultado = await enviarSmsSimulado({
    telefone,
    mensagem: `Clínica Alvea: agendamento de ${agendamento.especialidade} confirmado para ${agendamento.dataHora}.`,
  });

  return registrarNotificacao({
    canal: "sms",
    destinatario: telefone,
    pacienteId: usuario.id,
    agendamentoId: agendamento.id,
    tipo: "confirmacao_agendamento",
    simulado: true,
    enviado: resultado.enviado,
    erro: null,
  });
}

module.exports = { notificarAgendamento, registrarNotificacao };
